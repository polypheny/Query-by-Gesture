import os, io, json
import numpy as np
import cv2
import time
import tensorflow as tf
from keras.models import Model, load_model

class Classifier:
	global model
	global graph

	data = {'videoName' : 'stream', 'segmentNumber' : 0, 'gestures' :[]}
	frames = []
	fps = 0

	labels = []
	with open('labels.json') as jsonFile:
		data = json.load(jsonFile)
		for p in data['list']:
			labels.append(p['name'])

	def load(self):
		try:
			self.model = load_model('Gesture-Recognition-with-3DRESNET/model/3D_RESNET_101_drop_0.5/model.best.hdf5')
			self.graph = tf.get_default_graph()
			print("Model successfully loaded from disk.")

			#compile again
			self.model.compile(optimizer = 'adam', loss = 'categorical_crossentropy', metrics = ['accuracy'])

		except:
			print("Model not found")
			return None


	def getFrames(self, videoName, segmentNumber):
		duration = 1
		with open('segmentFiles/' + str(videoName[0:videoName.index('.')]) + 'Segments.json') as json_file:
			data = json.load(json_file)
			duration = float(data['videoDuration'])
			start = float((data['segments'][segmentNumber])['start'])
			end = float((data['segments'][segmentNumber])['end'])

		img_rows,img_cols=96, 64
		videoFrames = []
		vidcap = cv2.VideoCapture('videoFiles/' + str(videoName))
		success,frame = vidcap.read()

		if not success:
			print('could not load video')
		while success:
			frame = cv2.flip(frame, 3)
			frame = cv2.resize(frame, (640,480))

			image=cv2.resize(frame,(img_rows,img_cols),interpolation=cv2.INTER_AREA)
			gray = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

			videoFrames.append(gray)
			success,frame = vidcap.read()

		self.fps = float(len(videoFrames) / duration)
		videoFrames = videoFrames[int(self.fps*start):(int(self.fps*end) + 1)]

		ratio = len(videoFrames) / 16
		index = 0
		frames = []
		for i in range(16):
			frames.append(videoFrames[int(index)])
			index += ratio

		return frames

	def classify(self, videoName, mode, segmentNumber=0):
		img_rows,img_cols=96, 64

		if mode == 0:
			self.frames = self.getFrames(videoName, int(segmentNumber))
		else:
			frame = cv2.imread('streamFiles/' + videoName + '.jpeg')
			frame = cv2.flip(frame, 3)
			frame = cv2.resize(frame, (640,480))

			image=cv2.resize(frame,(img_rows,img_cols),interpolation=cv2.INTER_AREA)
			gray = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
			self.frames.append(gray)
			if len(self.frames) != 16:
				return self.data

		input=np.array(self.frames)

		self.frames = []
		# print(input.shape)
		X_tr = []
		X_tr.append(input)
		X_train= np.array(X_tr)
		# print(X_train.shape)
		train_set = np.zeros((1, 16, img_cols,img_rows,3))
		train_set[0][:][:][:][:]=X_train[0,:,:,:,:]
		train_set = train_set.astype('float32')
		train_set /=255
		with self.graph.as_default():
			result = self.model.predict(train_set)
		input=[]

		if mode == 1:
			videoName = 'stream'

		threshold = 0

		self.data = {'videoName' : str(videoName), 'segmentNumber' : int(segmentNumber), 'gestures' :[]}
		for i in range(len(result[0])):
			if result[0][i] > threshold:
				self.data['gestures'].append({'name': self.labels[i], 'probability': int(result[0][i]*100)})

		if mode == 0:
			self.saveResult(self.data, segmentNumber)

		return self.data

	def saveResult(self, data, segmentNumber):
		videoName = data['videoName']
		with io.open('resultFiles/' + str(videoName[0:videoName.index('.')]) + 'Segment' + segmentNumber + 'Result.json', 'w') as outfile:
			json.dump(data, outfile)

	def getFramesSegmenting(self, videoName, duration):
		img_rows,img_cols=96, 64
		frames = []
		vidcap = cv2.VideoCapture('videoFiles/' + str(videoName))
		success,frame = vidcap.read()

		if not success:
			print('could not load video')
		while success:
			frame = cv2.flip(frame, 3)
			frame = cv2.resize(frame, (640,480))

			image=cv2.resize(frame,(img_rows,img_cols),interpolation=cv2.INTER_AREA)
			gray = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

			frames.append(gray)
			success,frame = vidcap.read()

		self.fps = float(len(frames) / duration)

		return frames

	def segment(self, videoName, duration):
		img_rows,img_cols=96, 64

		allFrames = self.getFramesSegmenting(videoName, float(duration))

		values = np.zeros(len(allFrames))
		valuesCounter = np.zeros(len(allFrames))

		for i in range(len(allFrames)-15):
			self.frames = allFrames[i:i+16]

			input=np.array(self.frames)

			self.frames = []
			# print(input.shape)
			X_tr = []
			X_tr.append(input)
			X_train= np.array(X_tr)
			# print(X_train.shape)
			train_set = np.zeros((1, 16, img_cols,img_rows,3))
			train_set[0][:][:][:][:]=X_train[0,:,:,:,:]
			train_set = train_set.astype('float32')
			train_set /=255
			with self.graph.as_default():
				result = self.model.predict(train_set)
				input=[]

			values[i:i+16] += result[0][25]*100
			valuesCounter[i:i+16] += 1

		data = {'videoName' : str(videoName), 'videoDuration' : float(duration), 'segments' :[]}

		inSegment = False
		threshold = 40
		start = 0
		end = 0
		for i in range(len(values)):
			values[i] /= valuesCounter[i]
			if i == (len(values) - 1):
				if inSegment:
					end = (i-1) / self.fps
					data['segments'].append({'start': start, 'end': end})
				break
			if not inSegment:
				if values[i] <= threshold:
					inSegment = True
					start = i / self.fps
			else:
				if values[i] > threshold:
					inSegment = False
					end = (i-1) / self.fps
					data['segments'].append({'start': start, 'end': end})

		if len(data['segments']) == 0:
			data['segments'].append({'start': 0, 'end': duration})

		print(values)
		self.saveSegments(data)

	def saveSegments(self, data):
		videoName = data['videoName']
		with io.open('segmentFiles/' + str(videoName[0:videoName.index('.')]) + 'Segments.json', 'w') as outfile:
			json.dump(data, outfile)
