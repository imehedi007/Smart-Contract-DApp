import os
import cv2
import random
import warnings
import argparse
import logging
import numpy as np
import json
import datetime

import onnxruntime
from typing import Union, List, Tuple
from models import SCRFD, ArcFace
from utils.helpers import compute_similarity, draw_bbox_info, draw_bbox

warnings.filterwarnings("ignore")

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def parse_args():
    parser = argparse.ArgumentParser(description="Face Detection-and-Recognition")
    parser.add_argument(
        "--det-weight",
        type=str,
        default=os.path.join(SCRIPT_DIR, "weights", "det_10g.onnx"),
        help="Path to detection model"
    )
    parser.add_argument(
        "--rec-weight",
        type=str,
        default=os.path.join(SCRIPT_DIR, "w600k_r50.onnx"),
        help="Path to recognition model"
    )
    parser.add_argument(
        "--similarity-thresh",
        type=float,
        default=0.4,
        help="Similarity threshold between faces"
    )
    parser.add_argument(
        "--confidence-thresh",
        type=float,
        default=0.5,
        help="Confidence threshold for face detection"
    )
    parser.add_argument(
        "--faces-dir",
        type=str,
        default=os.path.join(SCRIPT_DIR, "faces"),
        help="Path to faces stored dir"
    )
    parser.add_argument(
        "--source",
        type=str,
        default=os.path.join(SCRIPT_DIR, "assets", "1.mp4"),
        help="Video file or video camera source. i.e 0 - webcam"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="output_video.mp4",
        help="Path to save the output video"
    )
    parser.add_argument(
        "--max-num",
        type=int,
        default=0,
        help="Maximum number of face detections from a frame"
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        help="Logging level"
    )

    return parser.parse_args()


def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), None),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def load_nid_database() -> dict:
    """
    Load NID database from backend's nid-bank.json file.
    Creates a mapping of NID -> person name and NID -> person_id.
    
    Returns:
        tuple: (nid_to_name_map, nid_to_person_id_map)
    """
    nid_to_name = {}
    nid_to_person_id = {}
    backend_path = os.path.join(os.path.dirname(SCRIPT_DIR), "backend", "nid-bank.json")
    
    if os.path.exists(backend_path):
        try:
            with open(backend_path, 'r') as f:
                nid_records = json.load(f)
                if isinstance(nid_records, list):
                    for record in nid_records:
                        if 'nid' in record and 'name' in record:
                            nid_to_name[record['nid']] = record['name']
                            # Store person_id if available, otherwise generate one
                            if 'person_id' in record:
                                nid_to_person_id[record['nid']] = record['person_id']
            logging.info(f"Loaded {len(nid_to_name)} NID records from database")
        except Exception as e:
            logging.warning(f"Failed to load NID database: {e}")
    else:
        logging.warning(f"NID database not found at {backend_path}")
    
    return nid_to_name, nid_to_person_id


def build_targets(detector, recognizer, params: argparse.Namespace) -> List[Tuple[np.ndarray, str]]:
    """
    Build targets using face detection and recognition.

    Args:
        detector (SCRFD): Face detector model.
        recognizer (ArcFaceONNX): Face recognizer model.
        params (argparse.Namespace): Command line arguments.

    Returns:
        List[Tuple[np.ndarray, str]]: A list of tuples containing feature vectors and corresponding image names.
    """
    targets = []
    for filename in os.listdir(params.faces_dir):
        name = filename[:-4]
        image_path = os.path.join(params.faces_dir, filename)

        image = cv2.imread(image_path)
        bboxes, kpss = detector.detect(image, max_num=1)

        if len(kpss) == 0:
            logging.warning(f"No face detected in {image_path}. Skipping...")
            continue

        embedding = recognizer(image, kpss[0])
        targets.append((embedding, name))

    return targets


def frame_processor(
    frame: np.ndarray,
    frame_number: int,
    detector: SCRFD,
    recognizer: ArcFace,
    targets: List[Tuple[np.ndarray, str]],
    colors: dict,
    params: argparse.Namespace,
    person_tracking: dict = None,
    nid_to_name: dict = None,
    nid_to_person_id: dict = None
) -> tuple:
    """
    Process a video frame for face detection and recognition.

    Args:
        frame (np.ndarray): The video frame.
        frame_number (int): Current frame number in the video.
        detector (SCRFD): Face detector model.
        recognizer (ArcFace): Face recognizer model.
        targets (List[Tuple[np.ndarray, str]]): List of target feature vectors and names.
        colors (dict): Dictionary of colors for drawing bounding boxes.
        params (argparse.Namespace): Command line arguments.
        person_tracking (dict): Dictionary to track person appearances across frames.

    Returns:
        tuple: (processed_frame, person_tracking)
    """
    if person_tracking is None:
        person_tracking = {}
    
    bboxes, kpss = detector.detect(frame, params.max_num)

    for bbox, kps in zip(bboxes, kpss):
        *bbox, conf_score = bbox.astype(np.int32)
        embedding = recognizer(frame, kps)

        max_similarity = 0
        best_match_name = "Unknown"
        best_match_nid = None
        for target, name in targets:
            similarity = compute_similarity(target, embedding)
            if similarity > max_similarity and similarity > params.similarity_thresh:
                max_similarity = similarity
                best_match_name = name
                # Extract NID from name - check if name is a NID number or contains colon
                if ':' in name:
                    best_match_nid = name.split(':')[0]
                elif name.isdigit():
                    # If name is all digits, it's likely a NID number
                    best_match_nid = name

        # Generate unique person ID - use name if matched
        if best_match_name != "Unknown":
            person_key = best_match_name
        else:
            # For unknown persons, check if embedding is similar to existing unknown persons
            # Only create new entry if significantly different from all existing unknowns
            person_key = None
            for existing_key in person_tracking:
                if existing_key.startswith("Unknown_Face_"):
                    # Check similarity with existing unknown person's average embedding
                    existing_avg_conf = person_tracking[existing_key]['total_confidence'] / person_tracking[existing_key]['frames_detected']
                    # If confidence is similar, it's probably the same person
                    if abs(max_similarity - existing_avg_conf) < 0.15:
                        person_key = existing_key
                        break
            
            # If no similar unknown found, create new entry
            if person_key is None:
                person_key = f"Unknown_Face_{len(person_tracking)}"
        
        # Track person data
        if person_key not in person_tracking:
            person_tracking[person_key] = {
                'person_id': f'P{str(len(person_tracking) + 1).zfill(3)}',
                'name': best_match_name,
                'nid': best_match_nid,
                'first_detected_frame': frame_number,
                'last_detected_frame': frame_number,
                'frames_detected': 1,
                'confidence_scores': [float(max_similarity)],
                'total_confidence': float(max_similarity)
            }
        else:
            person_tracking[person_key]['last_detected_frame'] = frame_number
            person_tracking[person_key]['frames_detected'] += 1
            person_tracking[person_key]['confidence_scores'].append(float(max_similarity))
            person_tracking[person_key]['total_confidence'] += float(max_similarity)

        # Draw on frame
        if best_match_name != "Unknown":
            color = colors.get(best_match_name, (0, 255, 0))
            # Get person's name from NID database if available
            person_name = best_match_name
            if best_match_nid and nid_to_name and best_match_nid in nid_to_name:
                person_name = nid_to_name[best_match_nid]
            draw_bbox_info(frame, bbox, similarity=max_similarity, name=person_name, color=color, nid=best_match_nid)
        else:
            draw_bbox(frame, bbox, (255, 0, 0))

    return frame, person_tracking


def main(params):
    setup_logging(params.log_level)
    logging.info(f"Starting face detection pipeline")
    logging.info(f"Input video: {params.source}")
    logging.info(f"Output video: {params.output}")

    detector = SCRFD(params.det_weight, input_size=(640, 640), conf_thres=params.confidence_thresh)
    recognizer = ArcFace(params.rec_weight)

    targets = build_targets(detector, recognizer, params)
    logging.info(f"Loaded {len(targets)} target faces")
    
    # Load NID database - get both name and person_id mappings
    nid_to_name, nid_to_person_id = load_nid_database()
    
    colors = {name: (random.randint(0, 256), random.randint(0, 256), random.randint(0, 256)) for _, name in targets}

    cap = cv2.VideoCapture(params.source)
    if not cap.isOpened():
        raise Exception("Could not open video or webcam")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    logging.info(f"Video properties - Resolution: {width}x{height}, FPS: {fps}, Total frames: {total_frames}")

    out = cv2.VideoWriter(params.output, cv2.VideoWriter_fourcc(*"avc1"), fps, (width, height))
    
    if not out.isOpened():
        raise Exception(f"Could not open video writer for {params.output}")

    frame_count = 0
    person_tracking = {}
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame, person_tracking = frame_processor(frame, frame_count, detector, recognizer, targets, colors, params, person_tracking, nid_to_name, nid_to_person_id)
        out.write(frame)
        frame_count += 1
        
        if frame_count % 30 == 0:
            logging.info(f"Processed {frame_count}/{total_frames} frames")

    cap.release()
    out.release()
    cv2.destroyAllWindows()
    
    # Prepare person metadata - simplified structure
    persons_data = []
    for person_key, data in person_tracking.items():
        avg_confidence = data['total_confidence'] / data['frames_detected']
        
        # Use NID database person_id if person is identified, otherwise use generated P001 format
        if data['nid'] and nid_to_person_id and data['nid'] in nid_to_person_id:
            final_person_id = nid_to_person_id[data['nid']]
        else:
            final_person_id = data['person_id']
        
        person_info = {
            'person_id': final_person_id,
            'average_confidence': round(avg_confidence, 4)
        }
        
        # Add identification if matched with NID database
        if data['nid'] and data['name'] != "Unknown":
            # Get the actual person name from NID database
            person_name = data['name']
            if data['nid'] in nid_to_name:
                person_name = nid_to_name[data['nid']]
            
            # Return identification as object with nid and name
            person_info['identification'] = {
                'nid': data['nid'],
                'name': person_name
            }
        else:
            person_info['identification'] = None
        
        persons_data.append(person_info)
    
    # Save metadata to a JSON file adjacent to the output video
    metadata_path = params.output.replace('.mp4', '_metadata.json')
    metadata = {
        'video_file': os.path.basename(params.output),
        'total_frames': frame_count,
        'fps': fps,
        'persons': persons_data,
        'processing_timestamp': datetime.datetime.now().isoformat()
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    logging.info(f"Metadata saved to: {metadata_path}")
    
    # Ensure the output video file is created properly
    if os.path.exists(params.output):
        logging.info(f"Face detection pipeline completed. Output saved to: {params.output}")
        logging.info(f"Detected {len(persons_data)} unique person(s)")
        # Verify file is not corrupt
        file_size = os.path.getsize(params.output)
        logging.info(f"Output file size: {file_size / (1024*1024):.1f} MB")
    else:
        raise Exception(f"Output video file was not created: {params.output}")


if __name__ == "__main__":
    args = parse_args()
    if args.source.isdigit():
        args.source = int(args.source)
    main(args)
