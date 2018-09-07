var fso = new ActiveXObject('Scripting.FileSystemObject')
var wsh = new ActiveXObject('WScript.Shell')
var stream = new ActiveXObject("ADODB.Stream")

function doIt() {
  var form = document.forms[0]
  var srcfile = form.elements['srcfile'].value
  var include = form.elements['include'].checked
  var hidcon = form.elements['hidcon'].checked
  var completion = form.elements['completion'].checked
  var distname = form.elements['distname'].value
  var icon = form.elements['icon'].value || 'assets\\default_icon.ico'
  var modal = document.getElementById('modal')
  var modalContent = document.getElementById('modal-content')
  var modalBtns = document.getElementById('modal-btns')
  
  if (isRequired(srcfile) && hasExtension(srcfile, ['bat', 'cmd', 'hta'], true) && isRequired(distname) && isWinFilename(distname)) {
    var src = splitPath(srcfile)
    var tempdir = wsh.ExpandEnvironmentStrings("%TEMP%")
    var tempfile = tempdir + '\\' + src.file
    var archive = tempdir + '\\' + 'thebatchman_' + distname + '.7z'
    var disttemp =  tempdir + '\\' + distname + '.tmp'
    var disticx =  tempdir + '\\' + distname + '.icx'
    var distexe = src.folder + '\\' + distname + '.exe'

    // Check icon and overwrite
    if (!hasExtension(icon, ['ico'], true)) return false
    if (!overwrite(distname + '.exe', src.folder)) return false

    modal.style.display = 'block'
    log('Processing...', modalContent, modalBtns)

    // HTA completion feedback and copy to temp directory
    stream.CharSet = 'utf-8'
    stream.Open()
    stream.LoadFromFile(srcfile)
    if (completion) {
      log('Adding completion line...', modalContent, modalBtns)
      var srcContent = stream.ReadText()
      stream.Close()
      stream.Open()
      srcContent += '\nstart "" mshta.exe javascript:alert("'+ distname +' complete");close()'
      stream.WriteText(srcContent)
    }
    stream.saveToFile(tempfile, 2)
    stream.Close()
    
    // Compress
    if (include) {
      log('Compressing all files...', modalContent, modalBtns)
      wsh.Run('bin\\7za.exe a -t7z -mx1 -y "' + archive + '" "' + tempfile + '" "' + src.folder + '\\*" -x!"' + srcfile +'"', 0, true)
    } else {
      log('Compressing...', modalContent, modalBtns)
      wsh.Run('bin\\7za.exe a -t7z -mx1 -y "' + archive + '" "' + tempfile +'"', 0, true)
    }

    // Create Config File for SFX
    log('Converting to executable...', modalContent, modalBtns)
    var sfxfile = tempdir + '\\' + 'thebatchman_' + distname + '_sfx.txt'
    var sfxconfig = ';!@Install@!UTF-8!'
    if (hidcon) sfxconfig += '\nRunProgram="hidcon:'+ src.file +'"'
      else sfxconfig += '\nExecuteFile="'+ src.file +'"'
    sfxconfig += '\nTitle="'+ distname +'"' +
      '\nExtractTitle="'+ distname +'"' +
      '\nGUIFlags="2+8+512"' +
      '\nGUIMode="1"' +
      '\n;!@InstallEnd@!'
    stream.Open()
    stream.WriteText(sfxconfig)
    stream.saveToFile(sfxfile, 2)
    stream.Close()

    // Create SFX
    binaryCopy(['bin\\7zsd_LZMA2.sfx', sfxfile, archive], disttemp)

    // Add Icon and Finalize
    log('Adding icon...', modalContent, modalBtns)
    binaryCopy([disttemp], disticx)
    wsh.Run('bin\\resourcer.exe -op:add -src:"'+ disticx +'" -type:icon -name:name -lang:1033 -file:"'+ icon +'"', 0, true)
    binaryCopy([disticx, disttemp], distexe)

    // Clean
    log('Cleaning...', modalContent, modalBtns)
    fso.DeleteFile(tempfile)
    fso.DeleteFile(disticx)
    fso.DeleteFile(disttemp)
    fso.DeleteFile(archive)
    fso.DeleteFile(sfxfile)
    log('Done !', modalContent, modalBtns)
    log('<span>'+ distexe +'</span>', modalContent, modalBtns)
    modalBtns.style.display = 'block'
  } else {
    location.reload()
  }
  
}

function binaryCopy(inputs, output) {
  var instream = new ActiveXObject("ADODB.Stream")
  var outstream = new ActiveXObject("ADODB.Stream")
  instream.Open()
  outstream.Open()
  instream.Type = outstream.Type = 1 // binary
  for (var i = 0; i < inputs.length; i++) {
    instream.LoadFromFile(inputs[i])
    outstream.Write(instream.Read())
  }
  outstream.SaveToFile(output, 2)
  instream.Close()
  outstream.Close()
}

function changeDistname() {
  var form = document.forms[0]
  var srcfile = form.elements['srcfile'].value
  var distname = form.elements['distname']
  distname.value = srcfile.split('\\').pop().replace(/\.[^/.]+$/, '')
  changeHideConsole()
}

function changeHideConsole(){
  var form = document.forms[0]
  var hidcon = form.elements['hidcon']
  var srcfile = form.elements['srcfile'].value
  if (hasExtension(srcfile, ['bat'], false)) {
    hidcon.disabled = false
    removeClass(hidcon.parentNode, 'text-muted')
  } else {
    hidcon.disabled = true
    hidcon.checked = false
    hidcon.parentNode.className += ' text-muted'
    changeCompletion()
  }
}

function changeCompletion() {
  var form = document.forms[0]
  var completion = form.elements['completion']
  var hidcon = form.elements['hidcon']
  if (hidcon.checked) {
    completion.disabled = false
    removeClass(completion.parentNode, 'text-muted')
  } else {
    completion.disabled = true
    completion.checked = false
    completion.parentNode.className += ' text-muted'
  }
}

function splitPath(input) {
  input = input.split('\\')
  var file = input.pop()
  var folder = input.join('\\')
  return {'folder': folder, 'file': file}
}

function isRequired(input) {
  if (input === null || input === '') {
    errorFeedback('.is-required', 'Missing values')
    return false
  }
  return true
}

function hasExtension(input, extensions, feedback) {
  var hasOne = extensions.some(function(ext){
    return input.indexOf(ext, input.length - ext.length) > -1
  })
  if (!hasOne){
    if (feedback) errorFeedback('.is-ext', 'Not a ' + extensions + ' file')
    return false
  } 
  return true
}

function isWinFilename(input) {
  var reWinFilename =/^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$"]*[^\|\*\?\\:<>/$"]+$/
  if (!reWinFilename.test(input)) {
    errorFeedback('.is-filename', 'Unauthorized filename')
    return false
  }
  return true
}

function overwrite(filename, filepath) {
  var folder = fso.GetFolder(filepath)
  var files = new Enumerator(folder.files)
  var filesList = ''
  for (i=0; !files.atEnd(); files.moveNext()) {
    filesList += files.item()
    filesList += ' '
  }
  var match = filesList.indexOf(filename)
  if (match !== -1) {
    if (confirm(filename + ' already exists.\nDo you want to overwrite it ?')) {
      fso.DeleteFile(filepath + '\\' + filename)
      return true
    } else {
      return false
    }
  }
  return true
}

function errorFeedback(els, message){
  forEachEl(els, function(el, i) {
    el.className += ' has-error has-feedback'
    var feedback = el.querySelectorAll('.form-control-feedback')[0]
    removeClass(feedback, 'hide')
  });
  alert(message)
}

function forEachEl(selector, fn) {
  var elements = document.querySelectorAll(selector)
  for (var i = 0; i < elements.length; i++) fn(elements[i], i)
}

function removeClass(el, classToRemove) {
  el.className = el.className.replace(new RegExp('(^|\\b)' + classToRemove.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
}

function log(message, parent, before) {
  var p = document.createElement('p')
  p.innerHTML = message
  if (before) {
    parent.insertBefore(p, before)
  } else {
    parent.appendChild(p)
  }
}
