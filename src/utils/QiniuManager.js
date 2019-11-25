

const qiniu = require('qiniu')

const axios = require('axios')

const fs = require('fs')

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.bucket = bucket
        this.config = new qiniu.conf.Config();
        // 空间对应的机房
        this.config.zone = qiniu.zone.Zone_z2;

        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    /**
     * 上传文件
     * @param {*} key 上传后的文件名
     * @param {*} localFilePath 需要上传的文件路径
     */
    uploadFile(key, localFilePath) {
        return new Promise((resolve, reject) => {
            const options = {
                scope: this.bucket + ":" + key,
            };
            const putPolicy = new qiniu.rs.PutPolicy(options);
            const uploadToken = putPolicy.uploadToken(this.mac);
            const formUploader = new qiniu.form_up.FormUploader(this.config);
            const putExtra = new qiniu.form_up.PutExtra();
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handelCallback(resolve, reject));
        })
    }

    /**
     * 删除文件
     * @param {*} key  文件在云服务器上的名称 
     */
    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handelCallback(resolve, reject));
        })
    }

    /**
     * 获取空间对应的域名
     */
    getBucketDomain() {
        const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
        const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, digest, this._handelCallback(resolve, reject))
        })
    }

    /**
     * 获取文件下载链接
     * @param {*} key   文件在云服务器上的名称
     */
    generateDownloadLink(key) {
        // 获取空间对应的域名，只需要获取一次
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain()

        return domainPromise.then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const pattern = /^https?/
                this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key)
            } else {
                throw Error('域名未找到，请查看存储空间是否已经过期')
            }
        })
    }

    /**
     * 下载文件
     * @param {*} key    文件在云服务器上的名称
     * @param {*} downLoadPath   下载到哪里
     */
    downLoadFile(key, downLoadPath) {
        return this.generateDownloadLink(key)
            .then(downURL => {
                const url = `${downURL}?timestamp=${new Date().getTime()}`
                return axios({
                    url,
                    method: 'GET',
                    responseType: 'stream',
                    headers: { 'Cache-Control': 'no-cache' }
                }).then(res => {
                    const writerStream = fs.createWriteStream(downLoadPath)
                    res.data.pipe(writerStream)
                    return new Promise((resolve, reject) => {
                        writerStream.on('finish', resolve)
                        writerStream.on('error', reject)
                    })
                })
            }).catch(err => {
                return Promise.reject({ err: err })
            })
    }

    getFileStat(key){
        return new Promise((resolve,reject)=>{
            this.bucketManager.stat(this.bucket, key,this._handelCallback(resolve,reject));
        })
    }

    _handelCallback(resolve, reject) {
        return (err, respBody, respInfo) => {
            if (err) {
                throw err;
            }
            if (respInfo.statusCode == 200) {
                resolve(respBody)
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })
            }
        }
    }
}

module.exports = QiniuManager