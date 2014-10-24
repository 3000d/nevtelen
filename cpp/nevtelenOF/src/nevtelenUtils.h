#ifndef NEVTELENUTILS_H
#define NEVTELENUTILS_H
#include "ofMain.h"
#include "ofxCv.h"

using namespace ofxCv;
using namespace cv;



class nevtelenUtils
{
    public:
        nevtelenUtils();
        virtual ~nevtelenUtils();
    protected:
    private:
};

class SmileDetector{
protected:
    ofRectangle roi;
    ofPixels gray;
    ofImage edge;
public:
    ofxCv::ObjectFinder faceFinder;
   void setup(){

    faceFinder.setup("haarcascade_frontalface_alt2.xml");
    faceFinder.setPreset(ofxCv::ObjectFinder::Accurate);
    faceFinder.setFindBiggestObject(true);
    faceFinder.setCannyPruning(true);
    faceFinder.setRescale(.4);
    faceFinder.getTracker().setPersistence(20);

}

template <class T>
void update(T& img){
    setImage(img);
    update(ofxCv::toCv(img));
}

void update(const cv::Mat& mat){
    faceFinder.update(mat);
    if(faceFinder.size()){
        try{
            roi = faceFinder.getObject(0);
            float lowerRatio = .35;
            roi.y += roi.height * (1-lowerRatio);
            roi.height *= lowerRatio;

            cv::Mat faceMat(mat, cv::Rect(roi.x,roi.y,roi.width,roi.height));
        }catch(cv::Exception& e){
            const char* err_msg = e.what();
            std::cout << "error " << err_msg << endl;
        }
    }
}
template <class T>
void setImage(T& img){
    convertColor(img, gray, CV_RGB2GRAY);
}

ofImage getEdge(float _min, float _max){
    Canny(gray, edge, _min, _max);
    edge.update();
    return edge;
}

void draw() const{
    faceFinder.draw();
}

bool getFaceFound() const{
    return faceFinder.size();
}

ofRectangle getFace() const{
    return faceFinder.getObject(0);
}

ofxCv::ObjectFinder getFaceFinder(){
    return faceFinder;
}

int getLabel(){
    return faceFinder.getLabel(0);
}

};


#endif // NEVTELENUTILS_H
