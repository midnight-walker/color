var express = require('express');
var router = express.Router();
var getPixels = require("get-pixels");
var MMCQ = require('../lib/mmcq');
var gm = require('gm');
var path = require('path');
var fs = require('fs');

function explorer(myPath) {
    let files = fs.readdirSync(myPath);

    let result = [];

    files.forEach(function (fileName) {
        let file = fs.statSync(myPath + "\\" + fileName);

        if (file.isDirectory()) {
            console.log(myPath + "\\" + fileName + "\\");
            explorer(myPath + "\\" + fileName);
        } else {
            result.push(fileName);
        }
    });

    return result;

}

/* GET home page. */
router.get('/', function (req, res, next) {
    let sitePath = path.resolve();
    let myPath = sitePath + '\\public\\images';
    let names = [];
    let result = [];
    let colorType = [];

    let fileList = explorer(myPath);
    console.log(fileList);

    fileList.forEach(item => {
        getPixels(myPath + "\\" + item, function (err, pixels) {
            if (err) {
                console.log("Bad image path");
                return
            }
            let arr = pixels.shape.slice();
            let width = arr[0];
            let height = arr[1];

            let pixelArray = [];

            let goOut = 0;
            let goIn = 0;

            for (var i = 0; i < width; i++) {
                for (var j = 0; j < height; j++) {
                    let r = pixels.get(i, j, 0), g = pixels.get(i, j, 1), b = pixels.get(i, j, 2);
                    if (r > 200 && g > 200 && b > 200) {
                        goOut++;
                    } else {
                        goIn++;
                        pixelArray.push([r, g, b]);
                    }
                }
            }

            var cmap = MMCQ.quantize(pixelArray, 32);

            var palette = cmap ? cmap.palette() : null;

            let cp = [];
            palette.forEach((item, idx) => {
                let r = item[0], g = item[1], b = item[2];
                if (r - g > 0 && r - b > 0) {
                    if(r<100){
                        cp.push('树干')
                    }else if (r - g > 20 && r - b > 20) {
                        cp.push('特别红');
                    }else if(r-g>10 && r-b>10){
                        cp.push('红');
                    }else{
                        cp.push('默认');
                    }
                } else if (g - r >5 && g - b > 5) {
                    cp.push('绿');
                }else {
                    cp.push('默认');
                }
            });

            names.push(item);
            result.push(palette);
            colorType.push(cp);

            if (result.length === fileList.length) {
                res.render('index', {
                    title: 'Express',
                    colors: JSON.stringify(result),
                    names: JSON.stringify(names),
                    colorType: JSON.stringify(colorType)
                });
            }
        });


    });
});

router.get('/getImg/', function (req, res, next) {
    let sitePath = path.resolve();


    let imgList = explorer(sitePath + '\\origin');
    imgList.forEach(item => {
        let w,h,x,y;
        gm(sitePath + "\\origin\\" + item)
            .size((err, size)=>{
                console.log(err);
                w=size.width/2;
                h=size.height/2;
                x=w/2;
                y=h/2;
            })
            .resize(1000, 1000)
            .noProfile()
            .write(sitePath + '\\public\\images\\' + item, function (err) {
                console.log(w,h,x,y);
                gm(sitePath + "\\origin\\" + item)
                    .crop(w,h,x,y)
                    .resize(500, 500)
                    .noProfile()
                    .write(sitePath + '\\public\\images\\中央-' + item, function (err) {

                    });
            });




    });


    res.send('done');
});


module.exports = router;
