#include "ofApp.h"

using namespace ofxCv;
using namespace cv;


float pixelThreshold;
float mult1,mult2, fading;
float edge_min=100;
float edge_max=200;
int maxPixelAge;
float area_threshold;
bool debug = true;

//--------------------------------------------------------------
void ofApp::setup(){
    receiver.setup(PORT);

    camWidth = 320;
    camHeight = 240;
    pixelThreshold = 162;
    mult1=0.98;
    mult2 =0.02;
    fading=0.2;
    blendMode = 0;
    exposureSpeed = 0.000126551;
    lastFoundId=-1;
    area_threshold = 0.09;

    ofEnableAntiAliasing();
    ofSetWindowTitle("Nevtelen - LightPainter (v.0.1)");

    vector<ofVideoDevice> devices = cam1.listDevices();
    for(int i = 0; i < devices.size(); i++){
		cout << devices[i].id << ": " << devices[i].deviceName;

        if( devices[i].bAvailable ){
            ofVideoDevice v = devices[i];
            String n = v.deviceName;
            if(ofIsStringInString(n,"Trust")){
                    std::cout << "setting trust as cam2 (id " << ofToString(v.id) << endl;
                cam2.setDeviceID(v.id);
                cam2.initGrabber(camWidth,camHeight);
                cam2.setDesiredFrameRate(30);
            }else{
                std::cout << "setting logitech as cam1 (id " << ofToString(v.id) << endl;
                 cam1.setDeviceID(v.id);
                cam1.initGrabber(camWidth,camHeight);
                cam1.setDesiredFrameRate(30);

                cam1.videoSettings();
            }

            cout << endl;
        }else{
            cout << " - unavailable " << endl;
        }
	}


    newPixels = new unsigned char[camWidth*camHeight*3];
    oldPixels = new unsigned char[camWidth*camHeight*3];
    pixelAge =  new unsigned char[camWidth*camHeight*3];

    highBitDepthPixels = new unsigned int[camWidth*camHeight*3];

    longExposureImage.allocate(camWidth,camHeight,GL_RGB);

    faceTracker.setup();
    image.allocate(camWidth,camHeight, OF_IMAGE_COLOR);


    faceFbo.allocate(ofGetWidth(),ofGetHeight());
    faceFbo.begin();
    ofClear(255,255,255);
    faceFbo.end();

    int totalPixels = camWidth*camHeight*3;
    for(int i = 0; i<totalPixels;i++){
        oldPixels[i] = 0;
    }
}

//--------------------------------------------------------------
void ofApp::update(){


    while(receiver.hasWaitingMessages()){
        ofxOscMessage m;
        receiver.getNextMessage(&m);
        if(m.getAddress() == "/EOD" && m.getArgAsString(0) == "true"){
            saveImg();
            clear();
        }
	if(m.getAddress() == "/SOD" && m.getArgAsString(0) == "true"){
		saveImg();
		clear();	
	}
    }

    int totalPixels = camWidth*camHeight*3;

    cam1.update();

    if(cam1.isFrameNew()){
        faceTracker.update(cam1);
        image = faceTracker.getEdge(100,100);

        if(faceTracker.getFaceFound()){
            if( ! faceTracker.getFaceFinder().getTracker().existsPrevious(lastFoundId)
                    && faceTracker.getFace().getArea() > (camWidth*camHeight)*area_threshold){
                        ofImage tmp;
                        float x,y,w,h;
                        x =faceTracker.getFace().getX();
                        y = faceTracker.getFace().getY();
                        w = faceTracker.getFace().getWidth();
                        h = faceTracker.getFace().getHeight();
                        tmp.setFromPixels(image.getPixelsRef());
                        tmp.crop(x,y,w,h);
                        tmp.resize(w*2,h*2);
                        tmp.saveImage("../../../../data/bmp/face_"+ofGetTimestampString()+".bmp");
                        std::cout << "Image area " << ofToString(faceTracker.getFace().getArea()) << endl;
                        std::cout << "Saving image" << endl;
                    }

                    lastFoundId = faceTracker.getLabel();

            // draw mosaic ?
           ofSetLineWidth(1);
               //            tracker.draw();
               ofRectangle r = faceTracker.getFace();
               //r.scale(0.5);
               float a = r.getArea();
               if(a > 0.0f ){
                   int grid = ofMap(r.getArea(),0,((camWidth*camHeight)/2),50,10);
                   float h = r.getHeight();
                   float w = r.getWidth();
                   const unsigned char* pix = cam1.getPixels();
                   faceFbo.begin();

                   ofClear(0,0,0);
                   ofPushStyle();
                   ofFill();
                   ofPushMatrix();
                   ofTranslate(r.x, r.y);
                   for(int y = 0; y < h; y+=grid){
                       for(int x =0; x<w; x+=grid){
                           int index = ((y+r.y)*cam1.width+x+r.x)*3;
                           // ofRotate(angle, 0, 1, 0);
                           ofSetColor(pix[index], pix[index+1], pix[index+2],240);

                          ofRect(x,y,grid,grid);
                       }
                   }

                   ofPopStyle();
                   ofPopMatrix();
                   faceFbo.end();
               }
        }
    }

    cam2.update();
    if(cam2.isFrameNew()){
        newPixels = cam2.getPixels();
        for(int i; i<totalPixels;i++){
            float temp1, temp2, temp3;
            temp1 = map(newPixels[i],0,255,0,100000);

            switch(blendMode){
                case 0:{
                    //if(newPixels[i]>pixelThreshold){
                        highBitDepthPixels[i]+=(exposureSpeed*temp1)/9.5;
                    //}
                    break;
                }
                case 1:{
                    if(newPixels[i]>pixelThreshold){
                        temp2 = float(mult1*highBitDepthPixels[i]);
                        highBitDepthPixels[i] = (mult2*temp2)+temp1;
                    }

                    break;
                }
                case 2:{
                    temp2 = float(0.98*highBitDepthPixels[i]);
                    highBitDepthPixels[i]=(0.03*temp1)+temp2;
                    break;
                }
                case 3:{
                    temp3 = float(0.8000*highBitDepthPixels[i]);
                    temp2 = float(0.1999*temp1)+temp3;
                    highBitDepthPixels[i]=(0.0001*temp1)+temp2;
                    break;
                }
                case 4:{
                    pixelAge[i]++;
                    if(pixelAge[i] > maxPixelAge){
                        highBitDepthPixels[i] *=0.2;
                    }
                    if(newPixels[i] > pixelThreshold){
                        if(pixelAge[i] <= maxPixelAge){
                            highBitDepthPixels[i]+=(exposureSpeed*temp1)/2;
                        }
                        pixelAge[i] = 0;

                    }else{
//                      highBitDepthPixels[i]=0;
                    }
                    break;
                }
                case 5:{
                    if(newPixels[i]>pixelThreshold){
                        highBitDepthPixels[i]+=(exposureSpeed*temp1)/2.5;
                    }else{
                        highBitDepthPixels[i]*=0.1;
                    }
                    break;
                }
                default:{
                    break;
                }
            }
                oldPixels[i] = map(highBitDepthPixels[i],0,100000,0,255);

            }
            longExposureImage.loadData(oldPixels, camWidth, camHeight, GL_RGB);
        }
   }


//--------------------------------------------------------------
void ofApp::draw(){
    float w = ofGetWidth()/2;
    float h = ofGetHeight()/2;
    ofBackground(0,0,0);
    cam1.draw(0,0, w, h);
    if(faceTracker.getFaceFound()){
        faceFbo.draw(0,0);
    }

    cam2.draw(w, 0, w, h);

    longExposureImage.draw(w,h, w,h);
    image.draw(0,h,w,h);
    if(faceTracker.getFaceFound()){
         faceTracker.draw();

    }

    if(debug){
        ofDrawBitmapStringHighlight("Blend Mode "+ofToString(blendMode), 10,ofGetHeight()-180);
        ofDrawBitmapStringHighlight("max pixel Age "+ofToString(maxPixelAge), 10,ofGetHeight()-160);
        ofDrawBitmapStringHighlight("edge_min "+ofToString(edge_min)+" edge_max "+ofToString(edge_max), 10,ofGetHeight()-140);
        ofDrawBitmapStringHighlight("pixelThreshold "+ofToString(pixelThreshold), 10,ofGetHeight()-120);
        ofDrawBitmapStringHighlight("exposure speed "+ofToString(exposureSpeed), 10,ofGetHeight()-100);
        ofDrawBitmapStringHighlight("Framerate : "+ofToString(ofGetFrameRate(), 2), 10, ofGetHeight()-80);
    }
}

//--------------------------------------------------------------
void ofApp::keyPressed(int key){
    switch (key) {
        case OF_KEY_UP:
            exposureSpeed*=1.2;

            break;
        case OF_KEY_DOWN:
            exposureSpeed*=0.8;

            break;
        case ' ':
            clear();
            break;
        case 's':
            saveImg();
        case 'a':{
//            mult1*=1.2;
            //pixelThreshold+=1;
            edge_max++;
            break;
        }
        case 'q':{
            //pixelThreshold-=1
            edge_max--;
            break;
        }
        case 'e':{
            //maxPixelAge+=10;
            edge_min++;
            break;
        }
        case 'd':{
            //maxPixelAge-=10;
            edge_min--;
            break;
        }
        case 'b':{

            blendMode++;

            if (blendMode >= 6) {
                blendMode=0;
            }
        }
        case 'i':{
            debug = !debug;
        }
        default:
            break;
    }
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){

}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y ){

}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){

}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){

}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){

}

void ofApp::exit(){
    cam1.close();
    cam2.close();


}

float ofApp::map(int value, int low1, int high1, int low2, int high2){

    //normalize:

    float v = float(value);
    float h1 = float(high1);
    float temp1 = float( v/h1);
    float temp2 = temp1 * high2;
    if (temp2 > high2)
    {temp2 = high2;  }

    if (temp2 < low2)
    {temp2 = low2;  }
    return( temp2);

}

void  ofApp::saveImg(){


    String imgName = "nevtelen_"+ ofToString(ofGetElapsedTimeMillis() ) + ".png";

    //load the pixels into an image file.
    //  outputPic.setFromPixels(oldPixels,camWidth, camHeight,1, true);
    outputPic.setFromPixels(oldPixels, camWidth, camHeight, OF_IMAGE_COLOR);
    outputPic.saveImage(imgName);


}


void  ofApp::clear(){
    int totalPixels = camWidth*camHeight*3;
    for (int i = 0; i < totalPixels; i++){

        if(blendMode ==2) {
            highBitDepthPixels[i] =100000;
        }

        else {
            highBitDepthPixels[i] =0;
        }



    }

}

