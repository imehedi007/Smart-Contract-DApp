import cv2
import numpy as np
import torch
import os
import onnxruntime
from time import time
from PIL import Image
from ultralytics import YOLO
import torch.backends.cudnn as cudnn
from detection import detect_faces

class ArcFace:
    def __init__(self, model_path):
        self.session = onnxruntime.InferenceSession(model_path)

    def get_embedding(self, image):
        img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (112, 112))
        img = np.transpose(img, (2, 0, 1)) 
        img = np.expand_dims(img, axis=0).astype(np.float32)
        img = img / 255.0 

        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        embedding = self.session.run([output_name], {input_name: img})[0]
        return embedding

def get_model(weights):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    device = 'mps' if torch.backends.mps.is_available() else device
    
    if device == 'cuda': cudnn.benchmark = True
    model = YOLO(weights)
    model.to(device)
    return model

def match_face(embedding, face_db, threshold=0.4):
    min_dist = float('inf')
    matched_name = "Unknown"
    
    for name, stored_embedding in face_db.items():
        dist = np.linalg.norm(stored_embedding - embedding)
        if dist < min_dist:
            min_dist = dist
            matched_name = name
    return matched_name

def normalize_embedding(embedding):
    norm = np.linalg.norm(embedding)
    if norm != 0:
        embedding = embedding / norm
    return embedding

# def match_face(embedding, face_db):
#     max_similarity = -1
#     matched_name = "Unknown"

#     embedding = normalize_embedding(embedding)
#     embedding = embedding.flatten() 

#     for name, stored_embedding in face_db.items():
#         stored_embedding = normalize_embedding(stored_embedding)
#         stored_embedding = stored_embedding.flatten()

#         cosine_similarity = np.dot(stored_embedding, embedding) / (np.linalg.norm(stored_embedding) * np.linalg.norm(embedding))
        
#         if cosine_similarity > max_similarity:
#             max_similarity = cosine_similarity
#             matched_name = name
    
#     return matched_name


def create_face_db(face_dir, arcface_model):
    face_db = {}
    for filename in os.listdir(face_dir):
        if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".jpeg"):
            image_path = os.path.join(face_dir, filename)
            img = cv2.imread(image_path)
            embedding = arcface_model.get_embedding(img)
            face_db[filename.split('.')[0]] = embedding 
    return face_db

detector = get_model('yolov8m_200e.pt') 
arcface_model = ArcFace('w600k_r50.onnx')

face_db = create_face_db('faces', arcface_model)

cap = cv2.VideoCapture(0)
total = []
first_time = time()

while cap.isOpened():
    success, image = cap.read()
    
    if not success:
        break

    start_time = time()

    crops, boxes, scores, cls = detect_faces(detector, [Image.fromarray(image)], box_format='xywh', th=0.4)
    
    fps = 1 / (time() - start_time)
    total.append(fps)

    for (left, top, right, bottom), score in zip(boxes[0], scores[0]):
        cv2.rectangle(image, (int(left), int(top)), (int(left + right), int(top + bottom)), (255, 0, 0), 2)
        cv2.putText(image, f"FPS: {fps:.2f}", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
        cv2.putText(image, f'Avg. FPS: {np.mean(total):.2f}', (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
        cv2.putText(image, f'Max. FPS: {max(total):.2f}', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
        cv2.putText(image, f'Min. FPS: {min(total):.2f}', (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)

        cropped_face = image[int(top):int(top + bottom), int(left):int(left + right)]
        
        embedding = arcface_model.get_embedding(cropped_face)
        
        matched_name = match_face(embedding, face_db)
        
        cv2.putText(image, f"Name: {matched_name}", (int(left), int(top) - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

    cv2.putText(image, f'{time() - first_time:.2f}s', (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)

    cv2.imshow('Surveillance', image)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
