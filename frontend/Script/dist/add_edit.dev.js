"use strict";

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('back').addEventListener('click', function () {
    window.location.href = "./admin_dashboard.html";
    if (window.sessionStorage.getItem('edit') !== null) window.sessionStorage.removeItem('edit');
  });
  document.querySelector('form').addEventListener('submit', function () {
    sessionStorage.setItem('showMessage', 'true'); // Save book info

    var bookData = {
      title: document.getElementById('title').value,
      author: document.getElementById('author').value,
      coverPath: document.querySelector('.book-cover').src,
      genre: document.getElementById('genre').value,
      format: document.getElementById('format').value,
      yearPub: document.getElementById('pub-time').value,
      availability: document.getElementById('availability').value,
      borrowNum: window.sessionStorage.getItem('edit') === 'true' ? bookParams.get('borrowNum') : '0',
      maxDuration: document.getElementById('mx-brw-dur').value,
      lateFees: document.getElementById('late-fee').value
    }; // Save book to database
  });
  document.getElementById('save').addEventListener('click', function () {
    return saveBook(book);
  });
  var imgHolder = document.querySelector('.img-holder');
  var imgInput = document.getElementById('img-input');
  var img = document.querySelector('.book-cover');
  var errorNotification = document.querySelector('.error');

  function loadImg(files) {
    var file = files[0];

    if (!file.type.match('image.*')) {
      errorNotification.classList.remove('hide');
      errorNotification.style.animation = 'notification 1.7s ease-in-out 2s backwards';
      errorNotification.addEventListener('animationend', function () {
        errorNotification.classList.add('hide');
        errorNotification.style.animation = '';
      });
      input.value = '';
      return;
    }

    var reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function (e) {
      img.src = e.target.result;
      document.querySelector('.upload').style.display = 'none';
      img.classList.remove('hide');
    };
  }

  imgHolder.addEventListener('click', function () {
    return imgInput.click();
  });
  imgInput.addEventListener('change', function () {
    if (imgInput.files.length) {
      loadImg(imgInput.files);
    }
  });
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
    imgHolder.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  imgHolder.addEventListener('drop', function (e) {
    var dt = e.dataTransfer;
    var files = dt.files;

    if (files.length) {
      loadImg(files);
    }
  });

  function willUpdate() {
    document.querySelector('.upload').style.display = 'flex';
    imgHolder.style.border = '3px dashed #9ea1a4';

    if (img.naturalWidth > 0 && img.style.display !== 'none') {
      img.style.opacity = 0.3;
    }
  }

  function notUpdated() {
    if (img.naturalWidth > 0 && img.style.display !== 'none') {
      document.querySelector('.upload').style.display = 'none';
      imgHolder.style.border = 'none';
      img.style.opacity = 1;
    }
  }

  imgHolder.addEventListener('mouseover', function () {
    return willUpdate();
  });
  imgHolder.addEventListener('dragover', function () {
    return willUpdate();
  });
  imgHolder.addEventListener('mouseout', function () {
    return notUpdated();
  });
  imgHolder.addEventListener('dragleave', function () {
    return notUpdated();
  });
  window.addEventListener('load', function () {
    if (window.sessionStorage.getItem('edit') === 'true') {
      var _bookParams = new URLSearchParams(window.location.search);

      document.querySelector('.upload').style.display = 'none';

      var _img = document.querySelector('.book-cover');

      _img.classList.remove('hide');

      _img.src = _bookParams.get('coverPath');
      document.getElementById('title').value = _bookParams.get('title');
      document.getElementById('author').value = _bookParams.get('author');
      document.getElementById('genre').value = _bookParams.get('genre');
      document.getElementById('format').value = _bookParams.get('format');
      document.getElementById('availability').value = _bookParams.get('availability');
      document.getElementById('pub-time').value = _bookParams.get('yearPub');
      document.getElementById('late-fee').value = _bookParams.get('lateFees');
      document.getElementById('mx-brw-dur').value = _bookParams.get('maxDuration');
    } else {
      document.querySelector('.upload').style.display = 'flex';
    }
  });
});