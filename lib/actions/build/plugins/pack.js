var path = require('path');
var fs = require('fs');
var fstream = require('fstream');
var tar = require('tar');
var zlib = require('zlib');
var request = require('request');

var help = require('../utils/moduleHelp.js');
var fsExt = require('../../../utils/fs_ext.js');

// 1. create build/moduleName dir.
// 2. copy src, dist, package.json to module dir.
// 3. compress module dir to tar.
// 5. upload tar to local.
module.exports = function(project, callback) {
  // 准备压缩包临时目录
  var tempTarPath = path.join(project.buildDirectory, '_tar', project.name);
  var tempDistPath = path.join(tempTarPath, 'dist'); 
  var tempSrcPath = path.join(tempTarPath, 'src'); 
  
  fsExt.mkdirS(tempDistPath);
  fsExt.mkdirS(tempSrcPath);

  fsExt.copydirSync(project.srcDirectory, tempSrcPath);
  fsExt.copydirSync(project.distDirectory, tempDistPath);
  fsExt.copyFileSync(project.baseDirectory, tempTarPath, 'package.json');


  // 默认配置文件中的源第一个是项目自身的源.

  var root = project.root;
  if (root === '#') {
    root = "";
  }

  var source = getSource(project); 
  var tarName = project.name + '.tgz';
  var relaPath = path.join(root, project.name, project.version);
  var sourceDir = path.join(project.baseSourcePath, source, relaPath);

  fsExt.mkdirS(sourceDir);

console.log(' upload tar ' + tarName + ' to ' + sourceDir);

  var tarPath = path.join(sourceDir, tarName);
  fstream.Reader({path: tempTarPath, type: "Directory"}).pipe(tar.Pack())
    .pipe(zlib.createGzip())
    .pipe(fstream.Writer(tarPath)).on('close', function() {
      console.log('')
      console.log(' success upload module tar to local!');
      console.log('')
    });
};

function getSource(project) {
  var sources = project.sources;
  if (!sources || sources.length === 0) {
    console.warn(project.name + ' not found available source!');
    return "";
  }
  return help.getHost(sources[0]);
}