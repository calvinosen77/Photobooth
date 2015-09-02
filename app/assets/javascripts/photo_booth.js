(function (context, $) {

  "use strict";

  context.PhotoBooth = function () {

    var $screen = null;
    var $startButton = null;
    var $allowScreen = null;
    var $stripBar = null;
    var $filters = null;
    var $snapPhoto = null;
    var $tips = null;
    var $currentFilter = null;
    var $video = null;
    var $filteredCanvas = null;
    var $photos = null;
    var $currentCanvas = null;
    var $waitNumbers = null;
    var $btnSnap = null;
    var $btnStop = null;
    var $snapOptions = null;
    var $previewButton = null;
    var $previewModal = null;
    var $targetCanvas = null;
    var $frames = null;
    var $videoPanel = null;
    var $uploadedPhotos = null;
    var $uploadPanel = null;
    var $fileInput = null;
    var $previewUploaded = null;
    var $btnManualUpload = null;
    var $mainAvatar = null;
    var $completedFrames = null;
    var $userInfo = null;
    var snapAllFrames = null;
    var cameraOn = null;
    var filter = null;
    var imageFilters = null;
    var current_tip = null;
    var waitingInterval = null;
    var animationInterval = null;
    var filterPreview = false;
    var userMedia = true;
    var $flashFallback = null;

    var FILTER_NAMES = ['amaro', 'earlybird', 'lofi', 'mayfair', 'rise', 'sierra', 'valencia', 'willow', 'xpro'];
    var FILTER_LENGTH = FILTER_NAMES.length;

    function mod(a, b) {
      return (a % b + b) % b;
    }

    function startPhotoBooth(e) {
      e.preventDefault();

      $uploadPanel.hide();
      $userInfo.hide();

      $allowScreen.modal({
        keyboard: false,
        backdrop: 'static'
      });
      $stripBar.show();
      
      if (!Webcam.userMedia) {
        Webcam.attach('#flash-fallback');
        $('.allow-message').text('☟ Please allow access to your camera ☟');
        userMedia = false;
      }
      else {
        Webcam.attach("#photo-video");
      }
    }

    function afterAllowCamera() {
      $screen.find('.select-filter').show();
      $allowScreen.modal('hide');
      $stripBar.hide();
      $video = $snapPhoto.find(".video video");
      
      $.each(FILTER_NAMES, function(index, filter) {
        var $canvas = $('.select-filter a.filter#' + filter + ' canvas');
        $video[0].play();
        drawVideo($video[0], $canvas, 150, 150, filter);
      });
    }

    function afterSelectFilter() {
      $screen.find(".select-filter").hide();
      current_tip = 1;
      $snapPhoto.show();
      updateTip();
      updateFilter();
      var context = $filteredCanvas[0].getContext('2d');
      context.translate(250, 0);
      context.scale(-1, 1);
      playCamera();
      snapAllFrames = true;
      resetSnap();
    }

    function updateTip() {
      $tips.find(".tip").hide();
      $tips.find(".tip" + current_tip.toString()).show();
      $tips.find(".current-tip").html(current_tip.toString() + " of 3");
    }

    function updateFilter() {
      $currentFilter.html(filter);
    }

    function selectFilter(e) {
      e.preventDefault();
      filter = $(this).attr("id");
      afterSelectFilter();
    }

    function nextTip(e) {
      e.preventDefault();
      current_tip = mod(current_tip, 3) + 1;
      updateTip();
      updateFilter();
    }

    function prevTip(e) {
      e.preventDefault();
      current_tip = mod(current_tip - 2, 3) + 1;
      updateTip();
    }

    function prevFilter(e) {
      e.preventDefault();

      var filterIndex = FILTER_NAMES.indexOf(filter);
      filterIndex = mod(filterIndex - 1, FILTER_LENGTH);
      filter = FILTER_NAMES[filterIndex];
      updateFilter();
    }

    function nextFilter(e) {
      e.preventDefault();

      var filterIndex = FILTER_NAMES.indexOf(filter);
      filterIndex = mod(filterIndex + 1, FILTER_LENGTH);
      filter = FILTER_NAMES[filterIndex];
      updateFilter();
    }

    function drawVideo(video, canvas, width, height, filter) {
      if (userMedia) {
        if (video.paused || video.ended) return false;
        var offset = (1 - video.videoHeight / video.videoWidth) * video.videoWidth / 2.0;
        canvas[0].getContext('2d').drawImage(video, offset, 0, video.videoWidth - 2 * offset, video.videoHeight, 0, 0, width, height);
      }
      else {
  			var raw_data = Webcam.getMovie()._snap();
  			var img = new Image();
  			img.src = 'data:image/png;base64,' + raw_data;
        img.onload = function() {
          var offset = (1 - this.height / this.width) * this.width / 2.0;
          canvas[0].getContext('2d').drawImage(this, offset, 0, this.width - 2 * offset, this.height, 0, 0, width, height);
        }
      }
      
      if (filterPreview) {
        $.each($('canvas.preview-filter-canvas'), function() {
          filterImage($(this), canvas, null, $(this).data('filter'), 250, 250, 150, 150);
        });
        filterPreview = false;
      }
      else {
        filterImage(canvas, canvas, null, filter, width, height);  
      }
    }

    function filterImage(toCanvas, origCanvas, origContext, filter, width, height, twidth, theight) {
      var orig_canvas = origCanvas[0];
      var orig_context = origContext;
      if (twidth == null) {
        twidth = width;
      }
      if (theight == null) {
        theight = height;
      }
      if (orig_context == null) {
        orig_context = orig_canvas.getContext('2d');
      }
      var to_canvas = toCanvas[0];
      var to_context = to_canvas.getContext('2d');

      if (toCanvas != origCanvas) {
        to_context.translate(width, 0);
        to_context.scale(-1, 1);
        to_context.drawImage(orig_canvas, 0, 0, width, height, 0, 0, twidth, theight);
        to_context.scale(-1, 1);
        to_context.translate(-width, 0);
      }
      
      if (filter != 'no-filter') {
        var imageData = to_context.getImageData(0, 0, width, height)
        imageFilters.filter(imageData, filter);
        to_context.putImageData(imageData, 0, 0);
        imageFilters.filterVignette(to_context, filter, twidth, theight);
      }
    }

    function playCamera() {
      drawVideo($video[0], $filteredCanvas, 250, 250, filter);
      requestAnimationFrame(playCamera);
    }

    function finishSnap() {
      $btnSnap.show();
      $btnStop.hide();

      var all_taken = true;
      $.each($photos.find(".frame canvas"), function(index, elem) {
        if (!$(elem).parent().data('snapped')) {
          all_taken = false;
        }
      });

      if (all_taken) {
        $snapOptions.show();
        $previewButton.show();
      }
    }

    function takeFramePhoto(currentCanvas, frameNumber) {
      if (snapAllFrames) {
        if (frameNumber > 3) {
          finishSnap();
          return false;
        }
        currentCanvas = $photos.find(".frame" + frameNumber.toString()).find('canvas');
      }
      var startNumber = 3;
      waitingInterval = setInterval(function() {
        $waitNumbers.show();
        if (startNumber == 0) {
          clearInterval(waitingInterval);
          $waitNumbers.hide();

          // Webcam.snap(function(data_uri, canvas, context) {
          //   filterImage(currentCanvas, canvas, context, filter, 250, 250);
          //   currentCanvas.parent().data('snapped', true);
          // }, currentCanvas[0]);
          filterImage(currentCanvas, $filteredCanvas, null, 'no-filter', 250, 250);
          currentCanvas.parent().data('snapped', true);

          if (snapAllFrames) {
            takeFramePhoto(null, frameNumber + 1);
          }
          else {
            finishSnap();
            return false;
          }
        }
        $waitNumbers.html(startNumber.toString());
        $waitNumbers
          .css('left', ($filteredCanvas.width() - $waitNumbers.width()) / 2)
          .css('top', ($filteredCanvas.height() - $waitNumbers.height()) / 2);
        startNumber = startNumber - 1;
      }, 1000);
    }

    function snapPhoto(e) {
      e.preventDefault();

      if (!snapAllFrames && $currentCanvas == null) {
        alert("You have to select frame to snap.");
        return;
      }

      $btnSnap.hide();
      $btnStop.show();

      if (snapAllFrames) {
        takeFramePhoto(null, 1);
      }
      else {
        takeFramePhoto($currentCanvas, 0);
      }
    }

    function stopSnap(e) {
      e.preventDefault();

      if (waitingInterval) {
        clearInterval(waitingInterval);
        finishSnap();
        $waitNumbers.hide();
      }
    }

    function selectFrame(e) {
      e.preventDefault();

      if (snapAllFrames) {
        return false;
      }

      $currentCanvas = $(this).find('canvas');
      $photos.find('.frame').removeClass('selected');
      $(this).addClass('selected');
    }

    function selectSnapType(e) {
      snapAllFrames = this.value != "on";
    }

    function playAnimation($target, $sources, frameInterval, cycleInterval) {
      if ($sources.length <= 0) return;
      frameInterval = typeof frameInterval !== 'undefined' ? frameInterval : 300;
      cycleInterval = typeof cycleInterval !== 'undefined' ? cycleInterval : 1200;

      var targetContext = $target[0].getContext('2d');

      var animationFunc = function() {
        targetContext.drawImage($sources[0], 0, 0, 250, 250);
        var start = 0;
        var frameKey = setInterval(function() {
          if (start >= $sources.length) {
            clearInterval(frameKey);
            targetContext.drawImage($sources[0], 0, 0, 250, 250);
            return;
          }
          targetContext.drawImage($sources[start], 0, 0, 250, 250);
          start++;
        }, frameInterval);
      };

      setTimeout(animationFunc, 30);
      animationInterval = setInterval(animationFunc, cycleInterval);
    }

    function previewAnimation(e) {
      e.preventDefault();

      $videoPanel.hide();

      $targetCanvas = $previewModal.find('canvas');
      $previewModal.modal({
        backdrop: 'static',
        keyboard: false
      });

      playAnimation($targetCanvas, $frames);
    }

    function previewUploaded(e) {
      e.preventDefault();

      $previewModal.modal({
        backdrop: 'static',
        keyboard: false
      });

      $targetCanvas = $previewModal.find('canvas');
      $frames = $uploadPanel.find(".upload-container canvas");
      playAnimation($targetCanvas, $frames);
    }

    function resetManualUpload() {
      $uploadPanel.find(".upload-container").attr('data-added', "false");
      $.each($uploadPanel.find(".upload-container canvas"), function(index, canvas) {
        removePhotoUpload($(canvas));
      });
      showPreview();
    }

    function resetSnap() {
      $snapOptions.hide();
      $previewButton.hide();
      snapAllFrames = true;
    }

    function cloneCanvases(oldCanvases) {
      var new_canvases = [];

      $.each(oldCanvases, function(index, old) {
        var new_canvas = $("<canvas/>");
        new_canvas.attr('width', old.width);
        new_canvas.attr('height', old.height);
        new_canvas[0].getContext('2d').drawImage(old, 0, 0);
        new_canvases.push(new_canvas);
      });

      return new_canvases;
    }

    function acceptPhotos(e) {
      e.preventDefault();

      $previewModal.modal('hide');
      $videoPanel.show();
      $userInfo.show();
      clearInterval(animationInterval);
      $uploadPanel.show();
      $snapPhoto.hide();
      $uploadPanel.find('#upload-panel').hide();

      $screen.find('.default-avatars').html(cloneCanvases($frames));

      if (cameraOn) {
        Webcam.reset();
        cameraOn = false;
      }
    }

    function declinePhotos(e) {
      e.preventDefault();

      $previewModal.modal('hide');
      $videoPanel.show();
      clearInterval(animationInterval);
    }

    function showPreview() {
      var all_uploaded = true;
      $.each($uploadPanel.find("li .upload-container"), function(index, panel) {
        if ($(panel).attr("data-added") == "false") {
          all_uploaded = false;
        }
      });

      if (all_uploaded) {
        $previewUploaded.show();
      }
      else {
        $previewUploaded.hide();
      }
    }

    function uploadPhoto(e) {
      e.preventDefault();

      $targetCanvas = $(this).parent().find('canvas');
      $fileInput.click();
    }

    function removePhotoUpload($canvas) {
      $canvas.parent().attr('data-added', "false");
      $canvas.parent().find('a.add-photo').show();
      $canvas.parent().find('a.remove-photo').hide();
      var context = $canvas[0].getContext('2d');
      context.fillStyle = 'lightgray';
      context.fillRect(0, 0, 250, 250);
    }

    function removePhoto(e) {
      e.preventDefault();

      removePhotoUpload($(this).parent().find('canvas'));
      showPreview();
    }

    function hoverPhoto(e) {
      if ($(this).attr('data-added') === "true") {
        $(this).find('.remove-photo').show();
      }
    }

    function leavePhoto(e) {
      $(this).find('.remove-photo').hide();
    }

    function inputFile(e) {
      if ($targetCanvas.length === 0) {
        return false;
      }
      var file = e.target.files[0],
        imageType = /image.*/;

      if (!file.type.match(imageType)) {
        alert("You have to select image files.");
        return;
      }

      var reader = new FileReader();
      reader.onload = fileOnload;
      reader.readAsDataURL(file);
    }

    function fileOnload(e) {
      var $img = $('<img>', { src: e.target.result });
      context = $targetCanvas[0].getContext('2d');

      $img.load(function() {
        context.drawImage(this, 0, 0, 250, 250);
        $targetCanvas.parent().attr('data-added', "true");
        $targetCanvas.parent().find('a.add-photo').hide();
        $fileInput.replaceWith( $fileInput = $fileInput.clone( true ) );
        showPreview();
      });
    }

    function clickManualUpload(e) {
      e.preventDefault();

      $uploadPanel.find('#upload-panel').show();
      resetManualUpload();
    }

    function events() {
      $startButton.on('click', startPhotoBooth);
      $filters.on('click', selectFilter);
      $tips.find(".tip-navigator .prev-tip").on('click', prevTip);
      $tips.find(".tip-navigator .next-tip").on('click', nextTip);
      $screen.find(".filter-selector .next-filter").on('click', nextFilter);
      $screen.find(".filter-selector .prev-filter").on('click', prevFilter);
      $btnSnap.on('click', snapPhoto);
      $btnStop.on('click', stopSnap);
      $photos.find(".frame").on('click', selectFrame);
      $snapOptions.find(".snap-type-checkbox").on('change', selectSnapType);
      $previewButton.on('click', previewAnimation);
      $previewModal.find("a#accept-photos").on('click', acceptPhotos);
      $previewModal.find("a#decline-photos").on('click', declinePhotos);
      $uploadPanel.find(".upload-container a.add-photo").on('click', uploadPhoto);
      $uploadPanel.find(".upload-container a.remove-photo").on('click', removePhoto);
      $uploadPanel.find(".upload-container").hover(hoverPhoto, leavePhoto);
      $fileInput.on('change', inputFile);
      $previewUploaded.on('click', previewUploaded);
      $btnManualUpload.on('click', clickManualUpload);
      $currentFilter.on('click', showFiltersModal);
      $mainAvatar.mouseenter(playAvatar);
      $mainAvatar.mouseleave(stopAvatar);
      $('canvas.preview-filter-canvas').on('click', chooseFilter);
    }
    
    function chooseFilter(e) {
      e.preventDefault();
      
      filter = $(this).data('filter');
      updateFilter();
      $(".filters-modal").modal('hide');
      $snapPhoto.show();
      filterPreview = false;
    }
    
    function showFiltersModal(e) {
      e.preventDefault();

      $(".filters-modal").modal({
        backdrop: 'static',
        keyboard: false
      });
      
      filterPreview = true;
      $snapPhoto.hide();
    }

    function playAvatar(e) {
      $completedFrames = $screen.find('.default-avatars').find('canvas');
      playAnimation($mainAvatar, $completedFrames);
    }

    function stopAvatar(e) {
      clearInterval(animationInterval);
    }

    function webcamLive() {
      setTimeout(function() {
        afterAllowCamera();
        cameraOn = true;
      }, 3000);
    }

    function webcamError(err) {
      console.log(err);
      $allowScreen.modal('hide');
      $stripBar.hide();
      $userInfo.show();
      cameraOn = false;
    }

    function initialize(imageFilter) {
      Webcam.init();
      Webcam.set({
        width: 250,
        height: 250,
        dest_width: 250,
        dest_height: 250,
        image_format: 'jpeg',
        jpeg_quality: 80,
      });
      Webcam.setSWFLocation('/assets/webcam.swf');

      Webcam.on('live', webcamLive);
      Webcam.on('error', webcamError);
      cameraOn = false;

      $screen = $(".photo-booth");
      $startButton = $screen.find("#photo-booth");
      $stripBar = $("body").find(".infobar-stripe");
      $allowScreen = $screen.find(".allow-screen");
      $filters = $screen.find(".select-filter a.filter");
      $snapPhoto = $screen.find('.snap-photo');
      $tips = $snapPhoto.find(".tips");
      $currentFilter = $screen.find(".filter-selector").find("#selected-filter");
      $filteredCanvas = $snapPhoto.find('canvas#filtered-video');
      $photos = $screen.find(".photos");
      $videoPanel = $screen.find('.video');
      $waitNumbers = $videoPanel.find('.wait-numbers');
      $btnSnap = $screen.find(".btn-snap");
      $btnStop = $screen.find(".btn-snap-stop");
      $snapOptions = $snapPhoto.find(".take-photo .snap-options");
      $previewButton = $photos.find("#preview-animation");
      $previewModal = $screen.find(".preview-modal");
      $frames = $photos.find('.frame canvas');
      $uploadPanel = $screen.find('.upload-photos');
      $fileInput = $uploadPanel.find('input#file-input');
      $uploadedPhotos = $uploadPanel.find("ul#upload-photos");
      $previewUploaded = $uploadPanel.find('#preview-uploaded-animation');
      $btnManualUpload = $uploadPanel.find('a#manual-photo-booth');
      $uploadedPhotos.sortable();
      $uploadedPhotos.disableSelection();
      $userInfo = $screen.find(".user-info");
      $mainAvatar = $screen.find('.photo-booth-avatar canvas');
      imageFilters = imageFilter;

      // wait avatar images to load
      var loaded = 0;
      $screen.find(".default-avatars img").one('load', function() {
        loaded++;

        if (loaded == 3) {
          $.each($screen.find(".default-avatars img"), function(index, img) {
            var $canvas = $("<canvas width=250 height=250/>");
            var context = $canvas[0].getContext('2d');
            context.drawImage(img, 0, 0, 250, 250);
            $(img).replaceWith($canvas);
          });
        }
      });

      events();
    }

    this.initialize = initialize;

    return this;
  };

})(window, jQuery);

