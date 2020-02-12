import sys
from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from flask_cors import CORS, cross_origin
import sys
import json, os, glob, io

sys.path.append('Gesture-Recognition-with-3DCNN/')

import classify

app = Flask(__name__)
api = Api(app)
CORS(app)

classifier = classify.Classifier()
classifier.load()

@app.route("/")
def hello():
	return "Welcome to the Gesture Recognition API"

@app.route('/segment', methods=['POST'])
def segment():
	""" 
	Receives segmentation request and replies with the result
	"""
	videoName = request.form['videoName']
	# Segmentation of video here ->
	videoName = videoName[0:videoName.index('.')]
	response = open('segmentFiles/' + videoName + 'Segments.json', 'r')
	return response.read().replace('\n', '')

@app.route('/classify', methods=['POST'])
def classifyApi():
	""" 
	Receives classification requests and replies with the result 
	"""
	videoName = request.form['videoName']
	videoDuration = request.form['videoDuration']
	segmentNumber = request.form['segmentNumber']
	exists = os.path.isfile('segmentFiles/' + str(videoName[0:videoName.index('.')]) + 'Segments.json')
	if not exists:
		data = {'videoName': videoName, 'videoDuration': float(videoDuration), 'segments': [{'start': 0, 'end': videoDuration}]}
		with io.open('segmentFiles/' + str(videoName[0:videoName.index('.')]) + 'Segments.json', 'w') as outfile:
			json.dump(data, outfile)
	videoName = videoName[0:videoName.index('.')]
	exists = os.path.isfile('resultFiles/' + videoName + 'Segment' + segmentNumber + 'Result.json')
	if exists:
		response = open('resultFiles/' + videoName + 'Segment' + segmentNumber + 'Result.json', 'r')
	else:
		classifier.classify(request.form['videoName'], 0, segmentNumber)
		response = open('resultFiles/' + videoName + 'Segment' + segmentNumber + 'Result.json', 'r')
	return response.read().replace('\n', '')

@app.route('/feedbackGesture', methods=['POST'])
def feedbackGesture():
	"""
	Receives and saves feedback to a classification
	"""
	jsonFeedback= request.get_json(force=True)
	videoName = jsonFeedback.get('videoName')
	videoName = videoName[0:videoName.index('.')]
	segmentNumber = jsonFeedback.get('segmentNumber')
	with open('resultFiles/' + videoName + 'Segment' + str(segmentNumber) + 'ResultImproved.json', 'w') as jsonFile:
		json.dump(jsonFeedback, jsonFile)
	# Start training classificator here ->
	createTrainingsData(jsonFeedback.get('videoName'), segmentNumber)
	return 'Successfull'

@app.route('/feedbackSegmentation', methods=['POST'])
def feedbackSegmentation():
	"""
	Receives and saves feedback to a classification
	"""
	jsonFeedback = request.get_json(force=True)
	videoName = jsonFeedback.get('videoName')
	videoName = videoName[0:videoName.index('.')]
	with open('segmentFiles/' + videoName + 'SegmentsImproved.json', 'w') as jsonFile:
		json.dump(jsonFeedback, jsonFile)
	# Start training classificator here ->
	return 'Successfull'

@app.route('/upload', methods=['POST'])
def upload():
	"""
	Receives and saves new video data for future classifications
	"""
	video = request.files['file']
	videoName = request.form['videoName']
	video.save('videoFiles/' + videoName)
	return 'Successfull'

@app.route('/stream', methods=['POST'])
def stream():
	"""
	Receives and saves new frames of a video stream
	"""
	frame = request.files['file']
	frameNumber = request.form['frameNumber']
	if frameNumber == str(0):
		files = glob.glob('streamFiles/*')
		for f in files:
			os.remove(f)
	frame.save('streamFiles/' + frameNumber +'.jpeg')
	#os.system('python3 classification.py ' + frameNumber + " 1")
	data = classifier.classify(frameNumber, 1)
	return jsonify(data)
	#print(request.form['videoName'])
	#with open('streamFiles/streamResult' + frameNumber + '.json', 'r') as response:
	#	print(response.read().replace('\n', ''))
	#	return response.read().replace('\n', '')

@app.route('/delete', methods=['DELETE'])
def delete():
	"""
	Receives requests for deleting certain files at the back-end
	"""
	path = request.form['path']
	files = glob.glob(path)
	for f in files:
		os.remove(f)
	return 'Successfull'

@app.route('/labels', methods=['GET'])
def labels():
	""" 
	Returns the list of existing labels
	"""
	response = open('labels.json', 'r')
	return response.read().replace('\n', '')

@app.route('/addLabel', methods=['POST'])
def addLabel():
	"""
	Saves newly added labels
	"""
	jsonFeedback = request.get_json(force=True)
	with open('labels.json', 'w') as jsonFile:
		json.dump(jsonFeedback, jsonFile)
	return 'Successfull'

def createTrainingsData(videoName, segmentNumber):
	"""
	Creates traingdata based on given feedback
	"""
	duration = 1
	with open('segmentFiles/' + str(videoName[0:videoName.index('.')]) + 'SegmentsImproved.json') as json_file:  
		data = json.load(json_file)
		duration = float(data['videoDuration'])
		start = float((data['segments'][segmentNumber])['start'])
		end = float((data['segments'][segmentNumber])['end'])

	img_rows,img_cols=125, 57 
	videoFrames = []
	vidcap = cv2.VideoCapture('videoFiles/' + str(videoName))
	success,frame = vidcap.read()
	
	if not success:
		print('could not load video')
	while success:
		videoFrames.append(frame)
		success,frame = vidcap.read()

	fps = float(len(videoFrames) / duration)
	videoFrames = videoFrames[int(fps*start):(int(fps*end) + 1)]

	videoNumber = len(os.listdir('trainingData'))
	os.mkdir('trainingData/' + str(videoNumber))
	for i in range(len(videoFrames)):
		cv2.imwrite('trainingData/' + str(videoNumber) + '/' + str(i) + '.png', videoFrames[i])

	with open('resultFiles/' + str(videoName[0:videoName.index('.')]) + 'Segment' + str(segmentNumber) + 'ResultImproved.json') as json_file:
		data = json.load(json_file)
		gesture = (data['gestures'][0])['name']

	fields=[str(videoNumber), gesture]
	with open('trainingData/labels.csv', 'a') as f:
		writer = csv.writer(f)
		writer.writerow(fields)

if __name__ == '__main__':
	app.run(port=5000)
