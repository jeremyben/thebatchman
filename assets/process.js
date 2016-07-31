var fso = new ActiveXObject('Scripting.FileSystemObject')
var wsh = new ActiveXObject('WScript.Shell')
var sa = new ActiveXObject('Shell.Application')
var stream = new ActiveXObject("ADODB.Stream")

function doIt() {
  var form = document.forms[0]
  var srcfile = form.elements['srcfile'].value
  var include = form.elements['include'].checked
  var hidcon = form.elements['hidcon'].checked
  var completion = form.elements['completion'].checked
  var distname = form.elements['distname'].value
  var icon = form.elements['icon'].value || false
  var upx = form.elements['upx'].checked
  
  if (isRequired(srcfile) && hasExtension(srcfile, ['bat', 'hta'], true) && isRequired(distname) && isWinFilename(distname)) {
    var src = splitPath(srcfile)
    var tempdir = wsh.ExpandEnvironmentStrings("%TEMP%")
    var tempfile = tempdir + '\\' + src.file
    var archive = tempdir + '\\' + 'thebatchman_' + distname + '.7z'
    var distexe = src.folder + '\\' + distname + '.exe'

    if (icon && !hasExtension(icon, ['ico'], true)) return false
    if (!checkOverwrite(distname, src.folder)) return false

    window.showModalDialog("assets\\wait.htm", null, "dialogHeight:150px; dialogWidth:300px; status:no; resizable:no; scroll:no")

    stream.CharSet = 'utf-8'
    stream.Open()
    stream.LoadFromFile(srcfile)
    if (completion) {
      var content = stream.ReadText()
      content += '\nstart "" mshta.exe javascript:alert("'+ distname +' complete");close()'
      stream.Flush()
      stream.WriteText(content)
    }
    stream.saveToFile(tempfile, 2)
    stream.Close()

    if (include) {
      sa.ShellExecute('bin\\7za.exe', 'a -t7z -mx1 -y ' + archive + ' ' + tempfile + ' ' + src.folder + '\\* -x!' + srcfile, '', '', 0)
    } else {
      sa.ShellExecute('bin\\7za.exe', 'a -t7z -mx1 -y ' + archive + ' ' + tempfile, '', '', 0)
    }

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

    // fso.DeleteFile(tempfile)
    // fso.DeleteFile(archive)
    // fso.DeleteFile(sfxfile)
    // alert('Done !')
    // window.close()
  } else {
    location.reload()
  }

  //wsh.Run("bin\\resourcer.exe")
  //sa.ShellExecute("bin\\resourcer.exe", "", "", "", 3)
  
  //wsh.Run("wait.hta")
  //sa.ShellExecute("wait.hta", "", "", "", 1)
  
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

function checkOverwrite(filename, filepath) {
  var folder = fso.GetFolder(filepath)
  var files = new Enumerator(folder.files)
  var filesList = ''
  for (i=0; !files.atEnd(); files.moveNext()) {
    filesList += files.item()
    filesList += ' '
  }
  var match = filesList.indexOf(filename + '.exe')
  if (match !== -1) {
    return confirm(filename + '.exe already exists.\nDo you want to overwrite it ?')
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
