window.resizeTo(350,490);
var fso = new ActiveXObject('Scripting.FileSystemObject');

function sendToBatch() {
  var form = document.forms[0];
  var batfile = form.elements['batfile'].value;
  var include = form.elements['include'].checked;
  var hidcon = form.elements['hidcon'].checked;
  var completion = form.elements['completion'].checked;
  var distname = form.elements['distname'].value;
  var icon = form.elements['icon'].value || false;
  if (icon && !hasExtension(icon, 'ico')) return false;
  if (isRequired(batfile) && hasExtension(batfile, 'bat') && isRequired(distname) && isWinFilename(distname)) {
    var src = splitPath(batfile);
    var output = src.folder +'~'+ src.file +'~'+ include +'~'+ hidcon +'~'+ completion +'~'+ distname +'~'+ icon;
    if (!checkOverwrite(distname, src.folder)) return false;
    fso.GetStandardStream(1).Write(output);
    window.close();
  }
}

function changeCompletion() {
  var form = document.forms[0];
  var completion = form.elements['completion'];
  var hidcon = form.elements['hidcon'];
  if (hidcon.checked) {
    completion.disabled = false;
    removeClass(completion.parentNode, 'text-muted');
  } else {
    completion.disabled = true;
    completion.checked = false;
    completion.parentNode.className += ' text-muted';
  }
}

function changeDistname() {
  var form = document.forms[0];
  var batfile = form.elements['batfile'].value;
  var distname = form.elements['distname'];
  distname.value = batfile.split('\\').pop().replace(/\.[^/.]+$/, '');
}

function splitPath(input) {
  input = input.split('\\');
  var file = input.pop();
  var folder = input.join('\\');
  return {'folder': folder, 'file': file};
}

function isRequired(input) {
  if (input === null || input === '') {
    errorFeedback('.is-required', 'Missing values');
    return false;
  }
  return true;
}

function hasExtension(input, extension) {
  if (input.indexOf(extension, this.length - extension.length) == -1){
    errorFeedback('.is-' + extension, 'Not a ' + extension + ' file');
    return false;
  } 
  return true;
}

function isWinFilename(input) {
  var reWinFilename =/^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$"]*[^\|\*\?\\:<>/$"]+$/;
  if (!reWinFilename.test(input)) {
    errorFeedback('.is-filename', 'Unauthorized filename');
    return false;
  }
  return true;
}

function checkOverwrite(filename, filepath) {
  var folder = fso.GetFolder(filepath);
  var files = new Enumerator(folder.files);
  var filesList = '';
  for (i=0;!files.atEnd();files.moveNext()) {
    filesList += files.item();
    filesList += ' ';
  }
  var match = filesList.indexOf(filename + '.exe');
  if (match !== -1) {
    return confirm(filename + '.exe already exists.\nDo you want to overwrite it ?');
  }
  return true;
}

function errorFeedback(els, message){
  forEachEl(els, function(el, i) {
    el.className += ' has-error has-feedback';
    var feedback = el.querySelectorAll('.form-control-feedback')[0];
    removeClass(feedback, 'hide');
  });
  alert(message);
}

function forEachEl(selector, fn) {
  var elements = document.querySelectorAll(selector);
  for (var i = 0; i < elements.length; i++)
    fn(elements[i], i);
}

function removeClass(el, classToRemove) {
  el.className = el.className.replace(new RegExp('(^|\\b)' + classToRemove.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
}
