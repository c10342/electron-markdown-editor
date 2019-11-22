const { remote ,ipcRenderer} = require('electron')

const Store = require('electron-store')

const store = new Store({ name: 'Settings' })

const $ = (selector) => {
  const dom = document.querySelectorAll(selector);
  return dom.length>1?dom:dom[0]
}

document.addEventListener('DOMContentLoaded', () => {
  const fileLocation = store.get('fileLocation', '')
  $('#savedFileLocation').setAttribute('value', fileLocation)

  const accessKey = store.get('accessKey', '')
  $('#accessKey').value = accessKey

  const secretKey = store.get('secretKey', '')
  $('#secretKey').value = secretKey

  const bucket = store.get('bucket', '')
  $('#bucketName').value =  bucket

  $('#select-new-location').addEventListener('click', () => {
    remote.dialog.showOpenDialog({
      title: '请选择文件夹',
      message: '请选择文件夹',
      properties: ['openDirectory']
    }).then(result => {
      const canceled = result.canceled
      const filePaths = result.filePaths
      if (!canceled && Array.isArray(filePaths) && filePaths.length > 0) {
        $('#savedFileLocation').setAttribute('value', filePaths[0])
      }
    })
  })

  $('#btn1').addEventListener('click', (e) => {
    e.preventDefault()
    const value = $('#savedFileLocation').getAttribute('value')
    if (value) {
      store.set('fileLocation', value)
      alert('保存成功')
    }else{
      alert('路径不能为空')
    }
  })

  $('#btn2').addEventListener('click', (e) => {
    e.preventDefault()
    const accessKey = $('#accessKey').value.trim()
    const secretKey = $('#secretKey').value.trim()
    const bucket = $('#bucketName').value.trim()
    // if (accessKey&&secretKey&&bucket) {
      store.set('accessKey', accessKey)
      store.set('secretKey', secretKey)
      store.set('bucket', bucket)
      alert('保存成功')
    // }else{
    //   alert('请填写完整')
    // }
    ipcRenderer.send('config-is-saved')
  })

  $('.nav-tabs').addEventListener('click',e=>{
    e.preventDefault()
    $('.nav-link').forEach(element => {
      const tab = element.dataset.tab
      $(tab).style.display = 'none'
      element.classList.remove('active')
    });
    e.target.classList.add('active')
    $(e.target.dataset.tab).style.display = 'block'
  })
})