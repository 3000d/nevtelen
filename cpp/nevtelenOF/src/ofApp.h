#pragma once

#include "ofMain.h"
#include "ofxCv.h"
#include "ofxOpenCv.h"
#include "nevtelenUtils.h"
#include "ofxOsc.h"

#define PORT 3333


class ofApp : public ofBaseApp{

	public:
		void setup();
		void update();
		void draw();
		void exit();

		void keyPressed(int key);
		void keyReleased(int key);
		void mouseMoved(int x, int y );
		void mouseDragged(int x, int y, int button);
		void mousePressed(int x, int y, int button);
		void mouseReleased(int x, int y, int button);
		void windowResized(int w, int h);
		void dragEvent(ofDragInfo dragInfo);
		void gotMessage(ofMessage msg);
        float map(int value, int low1, int high1, int low2, int high2);
        void clear();
        void saveImg();


		int camWidth;
		int camHeight;

		// Face capture
		SmileDetector faceTracker;
        ofVideoGrabber cam1;


		// Light capture
		ofVideoGrabber cam2;
		unsigned char * newPixels;
		unsigned char * oldPixels;
		unsigned char * pixelAge;
		unsigned int* highBitDepthPixels;
		ofTexture longExposureImage;
		ofFbo faceFbo;
		ofImage image;
		ofImage outputPic;

		int lastFoundId;
		long elapsedTime;

        float exposureSpeed;
        int blendMode;

        ofxOscReceiver receiver;
        String message;

};
