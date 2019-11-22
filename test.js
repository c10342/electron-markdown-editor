const QiniuManager = require('./src/utils/QiniuManager')
const path = require('path')
const accessKey = 'YBEYWaqwXhGNpNIuEOsuSyLtQ0i0b34gobjSYsKL';
const secretKey = '3BCpdcLZZ3wXw-l5psmu-D8RHjnmmlJnciUTeVuK';
const key='electron-vue 音视频播放器.md';
var localFile = "C:/Users/tecsun/Desktop/test/electron-vue 音视频播放器.md";
const downLoadPath = path.join(__dirname,'./name.md')

const qiniu = new QiniuManager(accessKey,secretKey,'clouddocument')
// qiniu.uploadFile(key,localFile)
// .then(data=>{
//     console.log(data)
//     return qiniu.generateDownloadLink(key)
// }).then(data=>{
//     console.log(data)
// }).catch(err=>{
//     console.log(err)
// })
qiniu.downLoadFile(key,downLoadPath).then(data=>{
    console.log('下载成功')
}).catch(err=>{
    console.log(err)
})
// qiniu.deleteFile(key)
// const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

// const options = {
//     scope: 'clouddocument',
// };
// const putPolicy = new qiniu.rs.PutPolicy(options);
// const uploadToken = putPolicy.uploadToken(mac);

// var config = new qiniu.conf.Config();
// 空间对应的机房
// config.zone = qiniu.zone.Zone_z2;
// 是否使用https域名
//config.useHttpsDomain = true;
// 上传是否使用cdn加速
//config.useCdnDomain = true;
// const formUploader = new qiniu.form_up.FormUploader(config);
// const putExtra = new qiniu.form_up.PutExtra();
// 文件上传
// formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr,
//   respBody, respInfo) {
//   if (respErr) {
//     throw respErr;
//   }
//   if (respInfo.statusCode == 200) {
//     console.log(respBody);
//   } else {
//     console.log(respInfo.statusCode);
//     console.log(respBody);
//   }
// });

// const bucketManager = new qiniu.rs.BucketManager(mac, config);
// const publicBucketDomain = 'clouddocument.s3-cn-south-1.qiniucs.com';
// // 公开空间访问链接
// const publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
// console.log(publicDownloadUrl);