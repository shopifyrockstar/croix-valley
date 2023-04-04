/*jshint -W087 */
/*jshint sub:true*/
/*jshint esnext: true */
/*jshint loopfunc:true */

// CustomEvent polyfill
(function() {
  if (typeof window.CustomEvent === "function") return false; //If not IE

  function CustomEvent(event, params) {
	params = params || { bubbles: false, cancelable: false, detail: undefined };
	var evt = document.createEvent("CustomEvent");
	evt.initCustomEvent(
	  event,
	  params.bubbles,
	  params.cancelable,
	  params.detail
	);
	return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
// ReplaceAll polyfill 
if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(str, newStr){
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}
		return this.replace(new RegExp(str, 'g'), newStr);
	};
}

//jQuery 'passive listeners to improve scrolling performance' fix
jQuery.event.special.touchstart = {
  setup: function( _, ns, handle ) {
    this.addEventListener("touchstart", handle, { passive: !ns.includes("noPreventDefault") });
  }
};
jQuery.event.special.touchmove = {
  setup: function( _, ns, handle ) {
    this.addEventListener("touchmove", handle, { passive: !ns.includes("noPreventDefault") });
  }
};
jQuery.event.special.wheel = {
  setup: function( _, ns, handle ){
    this.addEventListener("wheel", handle, { passive: true });
  }
};
jQuery.event.special.mousewheel = {
  setup: function( _, ns, handle ){
    this.addEventListener("mousewheel", handle, { passive: true });
  }
};

if (typeof theme === "undefined") {
  theme = {};
}
var html = $("html");
var body = $("body");
var winWidth = $(window).width();
var winHeight = $(window).height();
theme.mobileBrkp = 768;
theme.tabletBrkp = 981;

// Callback is a function which takes HTMLElement as parameter
// Threshold is an optional parameter – array of values between 0 and 1
function generateFireOnViewObserver (callback, threshold) {
	if (typeof threshold === undefined) threshold = [0.1];

	return !!window.IntersectionObserver ? new IntersectionObserver(
		function (elements, observer) {
			elements.forEach(function(element) {
				if (!element.isIntersecting) return;

				callback(element.target);
				observer.unobserve(element.target);
			});
		},
		{threshold: threshold}
	) : null;
}

theme.LibraryLoader = (function() {
  var types = {
    link: 'link',
    script: 'script'
  };

  var status = {
    requested: 'requested',
    loaded: 'loaded'
  };

  var cloudCdn = 'https://cdn.shopify.com/shopifycloud/';

  var libraries = {
    youtubeSdk: {
      tagId: 'youtube-sdk',
      src: 'https://www.youtube.com/iframe_api',
      type: types.script
    },
    plyr: {
      tagId: 'plyr',
      src: theme.assets.plyr,
      type: types.script
    },
    plyrShopify: {
      tagId: 'plyr-shopify',
      src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr-legacy.en.js',
      type: types.script
    },
    plyrShopifyStyles: {
      tagId: 'plyr-shopify-styles',
      src: cloudCdn + 'shopify-plyr/v1.0/shopify-plyr.css',
      type: types.link
    },
    shopifyXr: {
      tagId: 'shopify-model-viewer-xr',
      src: cloudCdn + 'shopify-xr-js/assets/v1.0/shopify-xr.en.js',
      type: types.script
    },
    modelViewerUi: {
      tagId: 'shopify-model-viewer-ui',
      src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.en.js',
      type: types.script
    },
    modelViewerUiStyles: {
      tagId: 'shopify-model-viewer-ui-styles',
      src: cloudCdn + 'model-viewer-ui/assets/v1.0/model-viewer-ui.css',
      type: types.link
    },
    masonry: {
      tagId: 'masonry',
      src: theme.assets.masonry,
      type: types.script
    },
	photoswipe: {
      tagId: 'photoswipe',
      src: theme.assets.photoswipe,
      type: types.script
    },
	fecha: {
      tagId: 'fecha',
      src: theme.assets.fecha,
      type: types.script
    },
	gmaps: {
		tagId: 'gmaps',
		src: 'https://maps.googleapis.com/maps/api/js?key=' + theme.map.key || '',
		type: types.script
	},
	gmapsSettings: {
		tagId: 'gmapsSettings',
		src: theme.map_settings_url,
		type: types.script
	}
  };

  function load(libraryName, callback, key) {
    var library = libraries[libraryName];

    if (!library) return;
		if (library.status === status.requested) return;

    callback = callback || function() {};
    if (library.status === status.loaded) {
      callback();
      return;
		}

    library.status = status.requested;

    var tag;

    switch (library.type) {
      case types.script:
        tag = createScriptTag(library, callback);
        break;
      case types.link:
        tag = createLinkTag(library, callback);
        break;
    }

    tag.id = library.tagId;
    library.element = tag;

    var firstScriptTag = document.getElementsByTagName(library.type)[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function createScriptTag(library, callback) {
    var tag = document.createElement('script');
    tag.src = library.src;
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  function createLinkTag(library, callback) {
    var tag = document.createElement('link');
    tag.href = library.src;
    tag.rel = 'stylesheet';
    tag.type = 'text/css';
    tag.addEventListener('load', function() {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  return {
    load: load
  };
})();

// ==========
// Local Pickup
// ==========
theme.StoreAvailability = function() {
	var selectors = {
  		storeAvailabilityContainer: '[data-store-availability-container]',
    	storeAvailabilityModalProductTitle: '[data-store-availability-modal-product-title]',
    	storeAvailabilityModalVariantTitle: '[data-store-availability-modal-variant-title]'
	};

	StoreAvailabilityInit = (function() {

	  function StoreAvailability(container) {
	    this.container = container;
	  }

	  StoreAvailability.prototype = Object.assign({}, StoreAvailability.prototype, {
	    updateContent: function(variantId, productTitle) {

	      var variantSectionUrl =
	        theme.routes.rootUrlSlash + 'variants/' + variantId + '/?section_id=store-availability';
	      this.container.innerHTML = '';

	      var self = this;
	      fetch(variantSectionUrl)
	        .then(function(response) {
	          return response.text();
	        })
	        .then(function(storeAvailabilityHTML) {
	          if (storeAvailabilityHTML.trim() === '') {
	            return;
	          }

	          $('.product-single__store-availability-container').html(storeAvailabilityHTML);
	          $('.product-single__store-availability-container').html($('.product-single__store-availability-container').children().html());

	          self._updateProductTitle(productTitle);

	        });
	    },

	    _updateProductTitle: function(productTitle) {
	      var storeAvailabilityModalProductTitle = $(this.container).find(
	      	selectors.storeAvailabilityModalProductTitle
	      );

	      storeAvailabilityModalProductTitle.text(productTitle);
	    }
	  });

	  return StoreAvailability;
	})();

	var storeAvailability;

	if ($('.js-product-single-actions').find(selectors.storeAvailabilityContainer).length) {
		storeAvailability = new StoreAvailabilityInit(selectors.storeAvailabilityContainer);
	}

	if (storeAvailability) {
		document.addEventListener("venue:variant:update",function(event) {
			//if variant is of the main product
      if (event.detail.product.id == $('.js-product-single').data('product-id')) {	
        //if variant exists
        if (event.detail.variant !== null) {
            $(selectors.storeAvailabilityContainer).show();
            storeAvailability.updateContent(
                event.detail.variant.id,
                event.detail.product.title
            );
        } else {
            $(selectors.storeAvailabilityContainer).hide();
        }
      }
		});
	}
};

// ==========
// Maps logic
// ==========
theme.runMap = function(mapElementId) {
	var thisMap = $("#" + mapElementId);

	var thisMapId = thisMap.data("map-id");
	var thisMapSection = thisMap.data("map-section");
	var thisMapAddress = thisMap.data("map-address");
	var thisMapStyle = thisMap.data("map-style");
	var thisMapPin = thisMap.data("map-pin");

	function mapInit(mapId, mapSection, mapAddress, mapStyle, mapPin) {
		var geocoder;
		var map;

		geocoder = new google.maps.Geocoder();
		var latlng = new google.maps.LatLng(1, 1);
		var myOptions = {
			zoom: 14,
			zoomControl: true,
			center: latlng,
			disableDefaultUI: true,
			scrollwheel: false,
			keyboardShortcuts: false,
			styles: window.mapStyles[mapStyle]
		};
		map = new google.maps.Map(document.getElementById(mapId), myOptions);

		if (geocoder) {
			geocoder.geocode({ address: mapAddress }, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
						map.setCenter(results[0].geometry.location);

						var marker = new google.maps.Marker({
							position: results[0].geometry.location,
							map: map,
							icon: window[mapPin]
						});
					}
				}
			});
		}
	}

	mapInit(thisMapId, thisMapSection, thisMapAddress, thisMapStyle, thisMapPin);
};

theme.homeMapsInitiate = function(mapContainerElement) {
	// if (!window.mapStyles) window.mapStyles = {};

	$(mapContainerElement).find(".js-map-info").hide(); //hide all items

	//show and activate first item in each map
	$(mapContainerElement)
		.find(".js-map-info")
		.first()
		.addClass("js-active")
		.show();
	$(mapContainerElement)
		.find(".js-map-trigger")
		.first()
		.addClass("js-active");

  function eachMapInit(mapContainer) {
		//move maps inside tab on mobile
		$(mapContainer).find(".js-map-replace").appendAround();

		$(mapContainer).find(".js-map-ids").each(function() {
			var thisMapId = $(this).data("map-id");

			theme.runMap(thisMapId);
		});
	}

	function triggerMapsInitiate(mapsContainer) {
		if (theme.map.key) {
			theme.LibraryLoader.load('gmaps', function() {
				theme.LibraryLoader.load('gmapsSettings', function() {
					eachMapInit(mapsContainer);
				});
			});
		} else {
			eachMapInit(mapsContainer);
		}
	}

	triggerMapsInitiate(mapContainerElement);
};

theme.homeMaps = function() {
  function mapTrigger() {
		$(document).on('click', '.js-map-trigger', function() {
			var thisItemId = $(this).attr("href");
			var $thisItem = $(thisItemId);
			var $theseItems = $thisItem
				.parents(".js-map")
				.find(".js-map-info");

			var trigger = $(".js-map-trigger");
			var activeClass = "js-active";

			//check if info is not active
			if (!$thisItem.hasClass(activeClass)) {
				$theseItems.removeClass(activeClass).slideUp();
				$thisItem
					.addClass(activeClass)
					.slideDown();
			}

			//map canvas functions
			$(this)
				.parents(".js-map")
				.find(".js-map-media")
				.removeClass(activeClass); //hide all within section
			$('.js-map-media[data-map-id="' + thisItemId + '"]').addClass(activeClass); //show active

			//run current map function if it's hidden within tab
			if ($thisItem.find(".home-map__media-canvas").length) {
				var thisMapId = $thisItem
					.find(".home-map__media-canvas")
					.attr("id");

				if (typeof thisMapId != "undefined") {
					theme.runMap(thisMapId);
				}
			}

			//check if info is not active
			if (!$(this).hasClass(activeClass)) {
				trigger.removeClass(activeClass);
				$(this).addClass(activeClass);
			}

			return false;
		});
	}

	mapTrigger();

	var homeMapsObserver = generateFireOnViewObserver(theme.homeMapsInitiate);

	var $mapsContainers = $('.js-map');

	if ($mapsContainers.length > 0) {
		if (homeMapsObserver) {
			$mapsContainers.each(function() {
				homeMapsObserver.observe(this);
			});
		} else {
			theme.LibraryLoader.load('gmaps', function() {
				theme.LibraryLoader.load('gmapsSettings', function() {
					$mapsContainers.each(function() {
						theme.homeMapsInitiate(this);
					});
				});
			});
		}
	}
};

// ===================
// Layout slider logic
// ===================
theme.layoutSliderUpdate = function(sliderElement) {
	var thisSlider = $(sliderElement);

	function addClassToSlide() {
		thisSlider
			.find(".slick-current")
			.addClass("js-slide-seen");
	}

	//get sizes
	winWidth = $(window).width();

	if (winWidth < theme.mobileBrkp) {
		thisSlider.removeClass('layout-slider--loading');

		thisSlider.not(".slick-initialized").slick({
			slidesToShow: 1,
			infinite: false,
			dots: true,
			arrows: false,
			centerMode: true,
			centerPadding: "30px"
		});
		thisSlider.on("afterChange", addClassToSlide);
	} else {
		//check if slick is initiated
		if (thisSlider.hasClass("slick-initialized")) {
			//detach slick
			thisSlider.slick("unslick");
			thisSlider.off("afterChange", addClassToSlide);
		}
	}
};

theme.layoutSliderInit = function(sliderElement) {
	function updateOnResize() {
		theme.layoutSliderUpdate(sliderElement);
	}

	theme.layoutSliderUpdate(sliderElement);

  $(window).on('resize', updateOnResize);
};


theme.layoutSlider = function(sliderClass) {
	if (!sliderClass) return;

	var $sliderElements = $(sliderClass);

	var layoutSliderObserver = generateFireOnViewObserver(theme.layoutSliderInit);

	$sliderElements.each(function() {
		if (layoutSliderObserver && !Shopify.designMode) {
			layoutSliderObserver.observe(this);
		} else {
			theme.layoutSliderInit(this);
		}
	});
};


function getSrcSet(src) {
  	var currSrc = "";
  	var srcSetStr = "";

  	[180, 360, 540, 720, 900, 1080, 1296, 1512].forEach(function (imageSize) {
  		currSrc = src.replace(/\.jpg|\.png|\.gif|\.jpeg/g, function(match) {
  			return '_'+imageSize+'x'+match;
  		});
  		srcSetStr = srcSetStr.concat(currSrc + ` ${imageSize}w ${imageSize}h, `);
  	});

  	return srcSetStr;
  }


theme.productCollSwatch = function() {
	function createSrcsetString(srcSetWidths, url, originalWidth, originalHeight) {
		if (!srcSetWidths || !url || !originalWidth || !originalHeight) return;

		const aspectRatio = parseInt(originalHeight, 10) / parseInt(originalWidth, 10);

		return srcSetWidths.reduce(function(srcSetString, srcSetWidth) {
			var sizeHeight = Math.floor(srcSetWidth * aspectRatio);
			srcSetString = srcSetString + url.replace('{width}', srcSetWidth) + ' ' + srcSetWidth + 'w ' + sizeHeight + 'h,';

			return srcSetString;
		}, '');
	}

 	$('.product-card__swatch__item').on('click', function() {

		var currentProduct = $(this).parents('.js-product');
		var currentProductImage = currentProduct.find('.js-img-grid');

		var currentHoverImage = currentProduct.find('.product-card__img-hover');

		var variantProductImage = $(this).data('variant-image');
		var variantProductImageWidth = $(this).data('variant-image-width');
		var variantProductImageHeight = $(this).data('variant-image-height');
		var variantUrl = $(this).data('variant-url');

		var newSrc = variantProductImage.replace('{width}', '300');
		var newSrcset = createSrcsetString([180, 360, 540, 720, 900, 1080, 1296, 1512], variantProductImage, variantProductImageWidth, variantProductImageHeight);

		//replace product image
		currentProductImage.attr('src', newSrc);
		currentProductImage.attr('width', '300');
		currentProductImage.attr('height', Math.floor(300 * (parseInt(variantProductImageHeight, 10) / parseInt(variantProductImageWidth, 10))));
		currentProductImage.attr('srcset', newSrcset);

		//replace product variant link
		currentProduct.find('.js-product-link').attr('href', variantUrl);

		//set swatch to active
		currentProduct.find('.js-product-swatch-item').removeClass('js-active');
		$(this).addClass('js-active');

		if(currentHoverImage[0]){
			var imageSrc = currentProductImage[0].src;
			var hoverSrc = currentHoverImage[0].src;
		
			var hoverEnabledClass = 'hover-enabled';
			var hoverDisabledClass = 'hover-disabled';

			if(imageSrc == hoverSrc){
				currentProductImage[0].classList.remove(hoverEnabledClass);
				currentHoverImage[0].classList.remove(hoverEnabledClass);

				currentProductImage[0].classList.add(hoverDisabledClass);
				currentHoverImage[0].classList.add(hoverDisabledClass);
			} else {
				currentProductImage[0].classList.remove(hoverDisabledClass);
				currentHoverImage[0].classList.remove(hoverDisabledClass);
				
				currentProductImage[0].classList.add(hoverEnabledClass);
				currentHoverImage[0].classList.add(hoverEnabledClass);
			}
		}

		return false;
	});
};

// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
  theme.ProductVideo.loadVideos(theme.ProductVideo.hosts.youtube);
}

theme.ProductVideo = (function() {
  var productCarousel = $('.js-product-slider');

  var videos = {};

  var hosts = {
    html5: 'html5',
    youtube: 'youtube'
  };

  var selectors = {
    productMediaWrapper: '[data-product-media-wrapper]'
  };

  var attributes = {
    enableVideoLooping: 'enable-video-looping',
    videoId: 'video-id'
  };

  function init(videoContainer, sectionId) {
    if (!videoContainer.length) {
      return;
    }

    var videoElement = videoContainer.find('iframe, video')[0];
    var mediaId = videoContainer.data('mediaId');

    if (!videoElement) {
      return;
    }

    videos[mediaId] = {
      mediaId: mediaId,
      sectionId: sectionId,
      host: hostFromVideoElement(videoElement),
      container: videoContainer,
      element: videoElement,
      ready: function() {
        createPlayer(this);
      }
    };

    var video = videos[mediaId];

    switch (video.host) {
      case hosts.html5:
        theme.LibraryLoader.load(
          'plyrShopify',
          loadVideos.bind(this, hosts.html5)
        );
        theme.LibraryLoader.load('plyrShopifyStyles');
        break;
      case hosts.youtube:
        theme.LibraryLoader.load('youtubeSdk');
        break;
    }
  }

  function createPlayer(video) {
    if (video.player) {
      return;
    }

    var productMediaWrapper = video.container.closest(
      selectors.productMediaWrapper
    );
    var enableLooping = productMediaWrapper.data(attributes.enableVideoLooping);

    switch (video.host) {
      case hosts.html5:
        // eslint-disable-next-line no-undef
        video.player = new Shopify.Plyr(video.element, {
          controls: [
            'play',
            'progress',
            'mute',
            'volume',
            'play-large',
            'fullscreen'
          ],
          youtube:	{ noCookie: false },
          loop: { active: enableLooping },
          hideControlsOnPause: true,
          iconUrl:
            '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
          tooltips: { controls: false, seek: true }
        });
        break;
      case hosts.youtube:
        var videoId = productMediaWrapper.data(attributes.videoId);

        video.player = new YT.Player(video.element, {
          videoId: videoId,
          events: {
            onStateChange: function(event) {
              if (event.data === 0 && enableLooping) event.target.seekTo(0);
            }
          }
        });
        break;
    }

    //on media reveal
   	productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
   		var thisSectionId = $(this).parents('.section').data('section-id');
	   	if (thisSectionId == video.sectionId) {
			if (video.container.data('slide-id') == nextSlide) {
	  			// if (!Modernizr.touchevents) {
					if (document.documentElement.classList.contains('no-touchevents')) {
	  				if (nextSlide !== currentSlide ) {//check if is first slide and is first load
	  					setTimeout(function() {
		  					if (video.host === hosts.html5) {
						        video.player.play();
						    }
						    if (video.host === hosts.youtube && video.player.playVideo) {
						        video.player.playVideo();
						    }
					    }, 300);
	  				}
	  			}
  			}
  		}
	});
	//on media hidden
	productCarousel.on('afterChange', function(event, slick, currentSlide){
		var thisSectionId = $(this).parents('.section').data('section-id');
	   	if (thisSectionId == video.sectionId) {
	      	if (video.container.data('slide-id') != currentSlide) {
	  			if (video.host === hosts.html5) {
			        video.player.pause();
			    }
			    if (video.host === hosts.youtube && video.player.pauseVideo) {
			        video.player.pauseVideo();
			    }
	      	}
      	}
    });

    //on XR launch
	$(document).on('shopify_xr_launch', function() {
		if (video.host === hosts.html5) {
	        video.player.pause();
	    }
	    if (video.host === hosts.youtube && video.player.pauseVideo) {
	        video.player.pauseVideo();
	    }
	});
  }

  function hostFromVideoElement(video) {
    if (video.tagName === 'VIDEO') {
      return hosts.html5;
    }
    if (video.tagName === 'IFRAME') {
      if (
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(
          video.src
        )
      ) {
        return hosts.youtube;
      }
    }
    return null;
  }

  function loadVideos(host) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.host === host) {
          video.ready();
        }
      }
    }
  }

  function removeSectionVideos(sectionId) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        if (video.sectionId === sectionId) {
          if (video.player) video.player.destroy();
          delete videos[key];
        }
      }
    }
  }

  return {
    init: init,
    hosts: hosts,
    loadVideos: loadVideos,
    removeSectionVideos: removeSectionVideos
  };
})();

theme.ProductModel = (function() {
  var modelJsonSections = {};
  var models = {};
  var xrButtons = {};
  var productCarousel = $('.js-product-slider');

  var selectors = {
    mediaGroup: '[data-product-media-group]',
    xrButton: '[data-shopify-xr]'
  };

  function init(modelViewerContainers, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false
    };

    modelViewerContainers.each(function(index) {
      var $modelViewerContainer = $(this);
      var mediaId = $modelViewerContainer.data('media-id');
      var $modelViewerElement = $(
        $modelViewerContainer.find('model-viewer')[0]
      );
      var modelId = $modelViewerElement.data('model-id');

      if (index === 0) {
        var $xrButton = $modelViewerContainer
          .closest(selectors.mediaGroup)
          .find(selectors.xrButton);
        xrButtons[sectionId] = {
          $element: $xrButton,
          defaultId: modelId
        };
      }

      models[mediaId] = {
        modelId: modelId,
        sectionId: sectionId,
        $container: $modelViewerContainer,
        $element: $modelViewerElement
      };
    });

    window.Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: setupShopifyXr
      },
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: setupModelViewerUi
      }
    ]);
    theme.LibraryLoader.load('modelViewerUiStyles');
  }

  function setupShopifyXr(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', function() {
        setupShopifyXr();
      });
      return;
    }

    for (var sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        var modelSection = modelJsonSections[sectionId];

        if (modelSection.loaded) continue;
        var $modelJson = $('#ModelJson-' + sectionId);

        window.ShopifyXR.addModels(JSON.parse($modelJson.html()));
        modelSection.loaded = true;
      }
    }
    window.ShopifyXR.setupXRElements();
  }

  function setupModelViewerUi(errors) {
    if (errors) {
      // When loadFeature is implemented, you can console or throw errors by doing something like this:
      // errors.forEach((error) => { console.warn(error.message); });
      return;
    }
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.$element);
        }
        setupModelViewerListeners(model);
      }
    }
  }

  function setupModelViewerListeners(model) {
      	var xrButton = xrButtons[model.sectionId];

		//on media reveal
	   	productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
	   		var thisSectionId = $(this).parents('.section').data('section-id');
	   		if (thisSectionId == model.sectionId) {
		   		if (model.$container.data('slide-id') == nextSlide) {
	      			// if (!Modernizr.touchevents) {
							if (document.documentElement.classList.contains('no-touchevents')) {
	      				if (nextSlide !== currentSlide ) {//check if is first slide and is first load
		      				xrButton.$element.attr('data-shopify-model3d-id', model.modelId);
		      				setTimeout(function() {
								model.modelViewerUi.play();
				  			}, 300);
				      	}
			      	}
			      	$(this).slick("slickSetOption", "swipe", false);
	      		}
	      	}
		});
		//on media hidden
		productCarousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
			var thisSectionId = $(this).parents('.section').data('section-id');
	   		if (thisSectionId == model.sectionId) {
		      	if (model.$container.data('slide-id') == currentSlide && model.$container.data('slide-id') != nextSlide) {
		      		xrButton.$element.attr('data-shopify-model3d-id', xrButton.defaultId);
		      		model.modelViewerUi.pause();
		      		$(this).slick("slickSetOption", "swipe", true);
		      	}
		    }
	    });

		//on XR launch
		$(document).on('shopify_xr_launch', function() {
			model.modelViewerUi.pause();
		});
  }

  function removeSectionModels(sectionId) {
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (model.sectionId === sectionId) {
          delete models[key];
        }
      }
    }
    delete modelJsonSections[sectionId];
  }

  return {
    init: init,
    removeSectionModels: removeSectionModels
  };
})();


theme.productMediaInit = function() {
  $('.product-single__photo__item--video').each(function(index) {
		theme.ProductVideo.init($(this) ,$('.section--product-single').data('section-id'));
  });
  if ($('.product-single__photo__item--model').length > 0) {
		theme.ProductModel.init($('.product-single__photo__item--model'), $('.section--product-single').data('section-id'));
  }
};

theme.homeProductMediaInit = function($element) {
	$element.find("[data-src]").each(function() {
		var $this = $(this);
		var src = $this.data('src');
		$this.attr('src', src);
	});
  $element.find('.product-featured__photo__item--video').each(function(index) {
		theme.ProductVideo.init($(this), $(this).parents('.section').data('section-id'));
  });
  $element.find('.js-section__home-product').each(function(index) {
  	if ($(this).has('.product-featured__photo__item--model').length) {
  		theme.ProductModel.init($(this).find('.product-featured__photo__item--model'), $(this).children('.section').data('section-id'));
  	}
  });
};

theme.productVariantAvailability = function(product, form, thisVariant, cssClass) {

	var productData = product;
	var productOptions = productData.options;
	var productForm = form;
	var variant = thisVariant;
	var selectorClass = cssClass;

	var soldClass = 'product-form__swatch__item--sold';
	var unavailableClass = 'product-form__swatch__item--unavailable';

	//check if selected variant exists
	if (variant == null) return;

	//get all available variants based on current variant and options count
	var reducedLength = productOptions.length - 2;
	var availableVariants = productData.variants.filter(thisVariant => 
		//if available
		thisVariant.available &&
		//if matching options count is relavent to options number
		thisVariant.options.filter(thisOption => variant.options.includes(thisOption)).length > reducedLength
		);

	//create a 2 dimentional array that available options will be added to
	var availableOptions = new Array(productOptions.length);
	for (var k = 0; k < availableOptions.length; k++) {
	  	availableOptions[k] = [];
	}

	//iterating to push available options to correct availableOptions dimention
	for (var i = productOptions.length - 1; i >= 0; i--) {
		//cycle each available variant
		for (var i2 = availableVariants.length - 1; i2 >= 0; i2--) {
			//cycle each option inside the available variant
			for (var i3 = availableVariants[i2].options.length - 1; i3 >= 0; i3--) {

				var option = availableVariants[i2].options[i3];
				//check if same option already exists
				if (availableOptions[i3].includes(option) === false) availableOptions[i3].push(option);
			}
		}
	}

	//get all sold variants based on current variant and options count
	var soldVariants = productData.variants.filter(thisVariant => 
		//if sold
		thisVariant.available == false &&
		//if matching options count is relavent to options number
		thisVariant.options.filter(thisOption => variant.options.includes(thisOption)).length > reducedLength
		);

	//create a 2 dimentional array that sold options will be added to
	var soldOptions = new Array(productOptions.length);
	for (var t = 0; t < soldOptions.length; t++) {
	  	soldOptions[t] = [];
	}

	//iterating to push sold options to correct soldOptions dimention
	for (var l = productOptions.length - 1; l >= 0; l--) {
		//cycle each available variant
		for (var l2 = soldVariants.length - 1; l2 >= 0; l2--) {
			//cycle each option inside the available variant
			for (var l3 = soldVariants[l2].options.length - 1; l3 >= 0; l3--) {

				var soldOption = soldVariants[l2].options[l3];
				//check if same options doesn't exist as same avaialble option
				//check if same option already exists
				if (availableOptions[l3].includes(soldOption) === false & soldOptions[l3].includes(soldOption) === false) soldOptions[l3].push(soldOption);
			}
		}
	}

	//add unavailable class to every option
	$(form).find('.product-form__swatch__item').addClass(unavailableClass);
	//remove sold class from every option
	$(form).find('.product-form__swatch__item').removeClass(soldClass);

	//add sold class to currently selected combo if it's sold out
  	if(variant.available == false){ 
      $(form).find(".product-form__swatch__item input[type=radio]:checked+label").parent().addClass(soldClass); 
	}

	//remove unavailable class from available options
	for (var j = availableOptions.length - 1; j >= 0; j--) {
		if (availableOptions[j].length > 0 ) {
			for (var j2 = availableOptions[j].length - 1; j2 >= 0; j2--) {

				var elemCount = j + 1;
				
				var parentElem = $(form).find(".js-product-form-swatch[data-option-index='" + elemCount + "']");
				var buttonElem = $(parentElem).find(".product-form__swatch__item[data-value='" + availableOptions[j][j2].replaceAll("'","-").replaceAll('"', '-') + "']");

				$(buttonElem).removeClass(unavailableClass);
			}
		}
	}

	//add sold class to sold out options
	//remove unavailable class from sold options
	for (var f = soldOptions.length - 1; f >= 0; f--) {
		if (soldOptions[f].length > 0 ) {
			for (var f2 = soldOptions[f].length - 1; f2 >= 0; f2--) {

				var soldElemCount = f + 1;
				
				var soldParentElem = $(form).find(".js-product-form-swatch[data-option-index='" + soldElemCount + "']");
				var soldButtonElem = $(soldParentElem).find(".product-form__swatch__item[data-value='" + soldOptions[f][f2].replaceAll("'","-").replaceAll('"', '-') + "']");

				$(soldButtonElem).removeClass(unavailableClass).addClass(soldClass);
			}
		}
	}
};

theme.productSelectAvailableVariant = function(form, thisVariant, thisSelector) {

	var productForm = form;
	var variant = thisVariant;
	var selector = thisSelector;

	var availableButtons = [];

	//iterate through all available variants
	for (var i = 0; i < selector.product.variants.length; i++) {

		var thisOptionPostion = Number(window.lastVariantBtn.dataset.position)-1;
		var thisOptionValue = selector.product.variants[i].options[thisOptionPostion];

		//TODO: find variant combo that's not sold out
		//find a variant that contains same option that was just clicked
		if (thisOptionValue == window.lastVariantBtn.value) {

			var thisFormOptions = $(productForm).find('.js-product-form-swatch');
			//iterate through every variant option in this form
			for (var i2 = 0; i2 < thisFormOptions.length; i2++) {

				//exclude variant opion which has a button that was just clicked
				if (thisFormOptions[i2].dataset.optionIndex != window.lastVariantBtn.dataset.position) {

					var thisValue = selector.product.variants[i].options[thisFormOptions[i2].dataset.optionIndex-1];
					var thisButton = $(productForm).find('.js-product-form-swatch[data-option-index='+ thisFormOptions[i2].dataset.optionIndex +']').find('input[value=' + thisValue);

					availableButtons.push(thisButton);
				}
			}
			//break forloop to only interact with the first variant
			break;
		}
	}

	//select available variant
	for (var i3 = 0; i3 < availableButtons.length; i3++) {

		var optionIndex = availableButtons[i3].closest('.js-product-form-swatch').attr('data-option-index');
		var optionValue = availableButtons[i3].val();

		availableButtons[i3].prop( "checked", true );

		//trigger change event only on the last option selected
		if((i3 + 1) == (availableButtons.length)){
			//change dropdown value and trigger change event
			availableButtons[i3]
			  .closest('.js-product-form-wrapper')
			  .find('.single-option-selector')
			  .eq(optionIndex - 1)
			  .val(optionValue)
			  .trigger('change');

		} else {
			//change dropdown value
			availableButtons[i3]
			  .closest('.js-product-form-wrapper')
			  .find('.single-option-selector')
			  .eq(optionIndex - 1)
			  .val(optionValue);

		}
	}
};

theme.productSelect = function(productId, sectionId, cssClass, historyState) {

	var productObj = document.getElementById('ProductJson-' + productId).innerHTML;
		productObj = JSON.parse(productObj || '{}');

	var sectionClass = '.section--' + sectionId;
	var productSelector = sectionClass + ' .js-product-' + productId;

	var selectCallback = function(variant, selector) {

		var productId = productObj.id;
		var thisSection = document.querySelector(sectionClass);
		var productForm = thisSection.querySelector('.js-product-form-wrapper--' + productId);

		document.dispatchEvent(
			new CustomEvent("venue:variant:update", {
				bubbles: true,
				detail: {
					product: productObj,
					variant: variant,
					sectionClass: sectionClass
				}
			})
		);

		//change how some variants visually display to indicate which ones are sold out or unavailable
		theme.productVariantAvailability(productObj, productForm, variant, cssClass);

		//slider functions
		var thisSlider = $(productSelector + " .js-product-slider");
		var sliderExists = thisSlider.length > 0  ? true : false;

		function checkSlick(slideToGo) {
			//move slider to variant after slick is init
			var interval = setInterval(function() {
				if (thisSlider.hasClass("slick-initialized")) {
					thisSlider.slick("slickGoTo", slideToGo);
					clearInterval(interval);
				}
			}, 100);
		}

		if (variant) {

			// Selected a valid variant that is available.
			// Variant unit pricing
			if (variant.unit_price_measurement) {
				var unitPrice = $(productSelector + ' .js-price-unit-price');
				var unitMeasure = $(productSelector + ' .js-price-unit-measure');

				var unitCurrentPrice = Shopify.formatMoney(variant.unit_price, theme.money_format);
				var unitCurrentMeasure = variant.unit_price_measurement.reference_value === 1 ? variant.unit_price_measurement.reference_unit
										: variant.unit_price_measurement.reference_value +variant.unit_price_measurement.reference_unit;

				unitPrice.html('<span class="money">' + unitCurrentPrice + '</span>');
				unitMeasure.text(unitCurrentMeasure);

				$(productSelector + ' .js-price-unit-note').css('display', 'inline-block');
			} else {
				$(productSelector + ' .js-price-unit-note').hide();
			}

			if (variant.available) {
				// Variant stock notification
				if (variant.inventory_management) {
					var qtyLimit = $(productSelector + " .js-price-stock-note").data('qty-limit');
					var variantQty = $(productSelector + " .js-product-variant-select option[value=" + variant.id + "]").data("qty");
					if (variantQty <= qtyLimit) {
						$(productSelector + " .js-price-stock-note").show();
						$(productSelector + " .js-price-stock-note span").text(variantQty);
					} else {
						$(productSelector + " .js-price-stock-note").hide();
					}
				} else {
					$(productSelector + " .js-price-stock-note").hide();
				}

				// Enabling add to cart button.
				$(productSelector + " .js-product-add")
					.removeClass("disabled")
					.prop("disabled", false)
					.find(".js-product-add-text")
					.text(theme.t.add_to_cart);

				$(productSelector + " .js-product-buttons").removeClass(
					"product-form__add--sold"
				);

				// Compare at price
				if (variant.compare_at_price > variant.price) {
					$(productSelector + " .js-product-price-number").html(
					'<span class="product-' +
						cssClass +
						"__price-number product-" +
						cssClass +
						'__price-number--sale"><span class="money">' +
						Shopify.formatMoney(variant.price, theme.money_format) +
						"</span></span>"
					);
					$(productSelector + " .js-product-price-compare").html(
					'<s class="product-' +
						cssClass +
						'__price-compare"><span class="money">' +
						Shopify.formatMoney(
						variant.compare_at_price,
						theme.money_format
						) +
						"</span></s>"
					);
				} else {
					$(productSelector + " .js-product-price-number").html(
					'<span class="product-' +
						cssClass +
						'__price-number"><span class="money">' +
						Shopify.formatMoney(variant.price, theme.money_format) +
						"</span></span>"
					);
					$(productSelector + " .js-product-price-compare").empty();
				}
			} else {
				// Variant stock notification hide
				$(productSelector + " .js-price-stock-note").hide();

				// Variant is sold out.
				$(productSelector + " .js-product-add")
					.addClass("disabled")
					.prop("disabled", true)
					.find(".js-product-add-text")
					.text(theme.t.sold_out);

				$(productSelector + " .js-product-buttons").addClass(
					"product-form__add--sold"
				);

				// Compare at price
				if (variant.compare_at_price > variant.price) {
					$(productSelector + " .js-product-price-number").html(
					'<span class="product-' +
						cssClass +
						"__price-number product-" +
						cssClass +
						'__price-number--sale"><span class="money">' +
						Shopify.formatMoney(variant.price, theme.money_format) +
						"</span></span>"
					);
					$(productSelector + " .js-product-price-compare").html(
					'<s class="product-' +
						cssClass +
						'__price-compare"><span class="money">' +
						Shopify.formatMoney(
						variant.compare_at_price,
						theme.money_format
						) +
						"</span></s>"
					);
				} else {
					$(productSelector + " .js-product-price-number").html(
					'<span class="product-' +
						cssClass +
						'__price-number"><span class="money">' +
						Shopify.formatMoney(variant.price, theme.money_format) +
						"</span></span>"
					);
					$(productSelector + " .js-product-price-compare").empty();
				}
			}

			if(cssClass == 'card'){
				//replace view details link
				var viewDetailsElem = productForm.parentElement.querySelector('.js-view-details');
				var updatedUrl = window.location.origin + '/products/' + selector.product.handle + '?variant=' + variant.id;

				viewDetailsElem.href = updatedUrl;
			}

			// remove quantity error on variant selection
			$('.qty-error').remove();

			if (variant.featured_image !== null) {
				if (variant.featured_image.variant_ids.length > 0) {

					if(sliderExists){
						var mediaId = variant.featured_media.id;
						var slide = $(productSelector + " .product-" + cssClass + "__photo__item[data-media-id*=" + variant.featured_media.id + "]");
						var slideId = slide.attr("data-slide-id");

						checkSlick(slideId);
					} else {

						var currImage = $( productSelector + " .js-img-modal" );
						var featureImageSrc = variant.featured_image.src.replace(/\.jpg|\.png|\.gif|\.jpeg/g, function(match) {
				  			return '_300x'+match;
				  		});

						currImage.attr("src", featureImageSrc);
						currImage.attr("srcset", getSrcSet(variant.featured_image.src));
					}

				} else {
					if(sliderExists){
						checkSlick(0);
					}
				}
			}

		} else {// variant doesn't exist

			// Variant unit notification hide
			$(productSelector + ' .js-price-unit-note').hide();
			// Variant stock notification hide
			$(productSelector + " .js-price-stock-note").hide();
			// Price and button
			$(productSelector + " .js-product-price-number").html('&nbsp;');
			$(productSelector + " .js-product-price-compare").empty();
			$(productSelector + " .js-product-add")
				.addClass("disabled")
				.prop("disabled", true)
				.find(".js-product-add-text")
				.text(theme.t.unavailable);

			//don't allow unavalable variant to be selected
			//find and select first available option combo based on the variant button just clicked
			if (window.lastVariantBtn) {
				theme.productSelectAvailableVariant(productForm, variant, selector);
			}
		}

		document.dispatchEvent(
			new CustomEvent("venue:variant:updated", {
				bubbles: true,
				detail: {
					product: productObj,
					variant: variant,
					sectionClass: sectionClass
				}
			})
		);
  };

  //SWATCH functions
  //match swatch to dropdown
  $(productSelector).find('.js-product-form-swatch :radio').on('change', function() {

  		//record which button was clicked for availability functions
		window.lastVariantBtn = this;

		var optionIndex = $(this).closest('.js-product-form-swatch').attr('data-option-index');
		var optionValue = $(this).val();


		$(this)
		  .closest('.js-product-form-wrapper')
		  .find('.single-option-selector')
		  .eq(optionIndex - 1)
		  .val(optionValue)
		  .trigger('change');

		//update sub title text
		var value = $(this).val();
		var sub_title = $(this).parents('.js-product-form-swatch').find('.js-swatch-variant-title');
		sub_title.text(value);

  });

  //initial color title text
  theme.productGridSwatchTitle();

  //check if product selected
  if (productObj.onboarding !== true) {

		new Shopify.OptionSelectors('productSelect' + '-' + sectionId + '-' + productId, {
			product: productObj,
			onVariantSelected: selectCallback,
			enableHistoryState: historyState
		});

		if (productObj.options.length == 1 && productObj.options[0] != "Title") {
			// Add label if only one product option and it isn't 'Title'. Could be 'Size'.
			$(productSelector + " .selector-wrapper:eq(0)").prepend(
			'<label for="productSelect-option-0">' +
				productObj.options[0] +
				"</label>"
			);
		}

		if (
			productObj.variants.length == 1 &&
			productObj.variants[0].title.indexOf("Default") > -1
		) {
			// Hide selectors if we only have 1 variant and its title contains 'Default'.
			$(productSelector + " .selector-wrapper").hide();
			$(productSelector + " .swatch").hide();
		}
  }
};

theme.productGridSwatchTitle = function() {
	$('.product-form__swatch').each(function(index, element) {	
		if ($(element).find('.js-swatch-color-item').length) {
			var swatchVal = $(this).find('.js-swatch-color-item input[name="color-c"]:checked').val();	
			var textElem = $(this).find('.js-swatch-variant-title').text(swatchVal);	
		}	
	});
};

// ================================================
// Product Grid - Image loading / spinner logic
// ================================================

theme.productGridImageObserver = function() {

	var productCards = document.querySelectorAll('.product-card');
	var div_array = [...productCards]; // converts NodeList to Array
	var loadingClass = 'loading';

	var observer = new MutationObserver(callback);

	function callback(mutationList) {
		mutationList.forEach(function(mutation) {
			if(mutation.type == 'attributes'){
				if(mutation.attributeName == 'src'){

					var oldUrlStr = mutation.oldValue.split('//cdn.shopify.com/').pop();
					var newUrlStr = mutation.target.src.split('//cdn.shopify.com/').pop();

					if(oldUrlStr !== newUrlStr){

						var currImage = mutation.target;
						var currSpinner = currImage.closest(".product-card__media").querySelector('.js-product-card__spinner');

						if (!currImage.classList.contains(loadingClass)) {
				  			currImage.classList.add(loadingClass);
				  			currSpinner.classList.add(loadingClass);
				  		}

				  		currImage.onload = function() {
				        	currImage.classList.remove(loadingClass);
				        	currSpinner.classList.remove(loadingClass);
				        };

		    		}
				}
			}
		});
	}

	productCards.forEach(function(card) {

		var cardImages = card.querySelectorAll('.product-card__img');

		cardImages.forEach(function(cImage) {
			observer.observe(cImage, {
				attributeFilter: [ "src" ],
				attributeOldValue: true,
				subtree: true
			});
		});
	});
};

// !! TODO: Check eventbrite integrations
theme.eventFeed = function(apiKey, templateId, anchorId, sectionId) {

  var orgUrl = "https://www.eventbriteapi.com//v3/users/me/organizations/?token=" + apiKey;

  $.getJSON(orgUrl, function(data) {}).done(function( data ) {

	var orgId = data.organizations[0].id;

    var eventsUrl =
		"https://www.eventbriteapi.com//v3/organizations/" +
        orgId +
        "/events/?token=" +
        apiKey +
        "&expand=venue&status=live";

      $.getJSON(eventsUrl, function(data) {
        var template = $(templateId).html();
        var compile = Handlebars.compile(template)(data);

        //compile and append tempalte with data
        $(anchorId).append(compile);
        //slider dunction
        theme.layoutSlider(".js-layout-slider-" + sectionId);

        //scrollreveal
        if ($("body").data("anim-load")) {
          sr.reveal(".section--" + sectionId + " .section__link", { distance: 0 });
          sr.reveal(".section--" + sectionId + " .home-event__item", {
            interval: theme.intervalValue
          });
        }
      });

      //format time helper
	  theme.LibraryLoader.load(
			'fecha',
			fechaHelper
	  );

  	  function fechaHelper() {
  		Handlebars.registerHelper("formatDate", function(date) {
	        return fecha.format(new Date(date), "ddd, DD MMM, HH:mm");
	    });
  	  }

      //limit loop helper
      Handlebars.registerHelper("each_upto", function(ary, max, options) {
        if (!ary || ary.length === 0) return options.inverse(this);
        var result = [];
        for (var i = 0; i < max && i < ary.length; ++i)
          result.push(options.fn(ary[i]));
        return result.join("");
      });
  });
};

// ================================================
// Home carousel functions & video background logic
// ================================================
theme.homeMainCarouselInit = function(carousel) {
  var $carousel = $(carousel);
  var currWinWidth = $(window).width();
  var mobileCond = currWinWidth >= 1;

  function loadVideos(thisCarousel) {
		var players = $(thisCarousel).find(".js-home-carousel-video-data");

		function onReadyVideo(event) {

			var iFrameSelector = '[data-video-id="' + event.target.getVideoData().video_id + '"]';
			var iFrameTarget = document.querySelector(iFrameSelector);

			event.target.mute();
			theme.videoSize(iFrameTarget);

			//check if this slide is active and play video if so
			if (
			$(iFrameTarget)
				.parents(".slick-slide")
				.hasClass("slick-active")
			) {
				event.target.playVideo();
				//adding timeout so video cover waits for youtube to start playing
				setTimeout(function() {
					$(iFrameTarget)
					.parent()
					.addClass("js-loaded");
				}, 800);
			}
		}

		function onChangeVideo(event) {
			if (event.data === YT.PlayerState.ENDED) {
				//when video ends - repeat
				event.target.playVideo();
			}
		}

		for (var i = 0; i < players.length; i++) {
			window[players[i].getAttribute("data-player-id")] = new YT.Player(
				players[i],
				{
					videoId: players[i].getAttribute("data-video-id"),
					host: 'https://www.youtube.com',
					playerVars: {
						iv_load_policy: 3,
						modestbranding: 1,
						playsinline: 1,
						cc_load_policy: 0,
						fs: 0,
						autoplay: 1,
						mute: 1,
						controls: 0,
						showinfo: 0,
						wmode: "opaque",
						quality: 'hd720',
						branding: 0,
						autohide: 0,
						rel: 0
					},
					events: {
						onReady: onReadyVideo,
						onStateChange: onChangeVideo
					}
				}
			);
		}
	}

	$carousel.on("init", function(event, slick) {

		// remove loading classes
		$carousel.closest('.home-carousel-wrapper').removeClass(function (index, className) {
			var newClasses = (className.match (/\bhome-carousel-wrapper--loading\S*/g) || []).join(' ');
			return newClasses;
		});
		$carousel.removeClass('home-carousel--loading');
		$carousel.removeClass('home-carousel--image--loading');

		//check if this carousel has youtube videos
		if ($carousel.find(".js-home-carousel-video--yt").length) {
			if (mobileCond) {
				//check if youtube API is loaded
				if (typeof YT === "undefined") {
					// insert youtube iframe API
					$.getScript("https://www.youtube.com/iframe_api")
					//after loaded
					.done(function() {
						var interval = setInterval(function() {
							//check if YT is function and loop if not
							if (typeof YT.Player === 'function') {
								loadVideos($carousel);
								clearInterval(interval);
							}
						}, 100);
					});
				} else {
					loadVideos($carousel);
				}
			}
		}

		//check if this carousel has self hosted videos
		if ($carousel.find(".js-home-carousel-video--self").length) {
			// check if self hosted video is first slide and initiate active class
			if ($carousel.find("[data-slide-id='0']").find('.js-home-carousel-video--self').length) {
				var $selfVideo = $carousel.find("[data-slide-id='0']").find('.js-home-carousel-video--self');
				// TODO: Check video load event
				setTimeout(function() {
					$selfVideo.addClass("js-loaded");
				}, 300);
			}
		}

		//content loading classes
		$(this)
			.find(".slick-active")
			.addClass("js-slide-active");
	});

	$carousel.on("afterChange", function(event, slick, currentSlide) {
		if (mobileCond) {
			//for youtube

			var $currentSlideElement = $carousel.find("[data-slide-id='" + currentSlide + "']");

			if ($currentSlideElement.find(".js-home-carousel-video--yt").length) {
				var dataPlayerId = $(this)
					.find(".slick-active .js-home-carousel-video-data")
					.attr("data-player-id");

				if (window[dataPlayerId].B) {
					//check if element is ready
					window[dataPlayerId].playVideo();
				} else {
					setTimeout(function() {
						window[dataPlayerId].playVideo();
					}, 1000);
				}

				var thisYTVideo = $(this).find(
					".slick-active .js-home-carousel-video"
				);
				//adding timeout so video cover waits for youtube to initiate loading
				// TODO: Load event?
				setTimeout(function() {
					thisYTVideo.addClass("js-loaded");
				}, 800);
			}

			//for self hosted
			if ($currentSlideElement.find(".js-home-carousel-video--self").length) {
				var $selfVideo = $carousel.find(
					".slick-active .js-home-carousel-video"
				);
				setTimeout(function() {
					$selfVideo.addClass("js-loaded");
				}, 300);
			}
		}

		//content loading classes
		$carousel
			.find(".slick-slide")
			.removeClass("js-slide-active");
		$carousel
			.find(".slick-active")
			.addClass("js-slide-active");
	});

	//reset scroll reveal geometry
	$carousel.on('setPosition', function reSync() {
		if (window.sr) window.sr.delegate();
	});

	$carousel.not(".slick-initialized").slick({
		accessibility: true,
		ariaPolite: false,
		slidesToShow: 1,
		slidesToScroll: 1,
		infinite: true,
		dots: true,
		fade: true,
		cssEase: "linear",
		adaptiveHeight: true,
		prevArrow:
		'<div class="home-carousel__nav home-carousel__nav--prev"><i class="icon icon--left-t"></i></div>',
		nextArrow:
		'<div class="home-carousel__nav home-carousel__nav--next"><i class="icon icon--right-t"></i></div>'
	});

};

theme.homeMainCarousel = function() {
  var $carousels = $(".js-home-carousel");

	var homeMainCarouselObserver = generateFireOnViewObserver(theme.homeMainCarouselInit);

	if (homeMainCarouselObserver && !Shopify.designMode) {
		$carousels.each(function() {
			homeMainCarouselObserver.observe(this);
		});
	} else {
		$carousels.each(function() {
			theme.homeMainCarouselInit(this);
		});
	}

  //recalculate all iframe sizes on browser resize
  var videoResizeTimer;
  $(window).on('resize', function() {
		winWidth = $(window).width();
		clearTimeout(videoResizeTimer);
		videoResizeTimer = setTimeout(function() {
			theme.videoSize($(".js-home-carousel-video-data"));
		}, 500);
  });
};

theme.videoSize = function(video) {
  //set elems
  var iframe = $(video);

  //find video size
  var origHeight = iframe.attr("height");
  var origWidth = iframe.attr("width");

  //find element width and caclulate new height
  var parentHeight = iframe.parent().height();
  var parentWidth = iframe.parent().width();

  //calc height and width based on original ratio
  var newHeight = (parentWidth / origWidth) * origHeight;
  var newWidth = (parentHeight / origHeight) * origWidth;

	//check if video ratio fits with carousel container and add css settings
	// TODO: Change to transforms
  if (parentHeight < newHeight) {
		iframe.css({
			width: parentWidth + "px",
			height: newHeight + 120 + "px",
			top: (parentHeight - newHeight) / 2 - 60 + "px",
			left: 0
		});
  } else {
		iframe.css({
			width: newWidth + "px",
			height: parentHeight + 120 + "px",
			left: (parentWidth - newWidth) / 2 + "px",
			top: '-60px'
		});
  }
};

// ========================
// Home video gallery logic
// ========================
theme.homeVideoGalleryPlayers = [];

theme.homeVideoGalleryInit = function(videoStageElement) {
	var $videoStage = $(videoStageElement);

  function vimeoThumbs() {
		//iteration for all thumbs while waiting for ajax to complete
		var i = 0;
		var $vimeoThumbs = $videoStage.parent().find(".js-vimeo-thumb");
		var $vimeoPlaceholder = $videoStage.find(".js-vimeo-placeholder");

		function next() {
			if (i < $vimeoThumbs.length) {
				thisThumb = $vimeoThumbs[i];
				var vimeoID = $(thisThumb).attr("data-video-id");

				$.ajax({
					url: "https://vimeo.com/api/oembed.json?url=https://vimeo.com/" + vimeoID,
					dataType: "json",
					complete: function(data) {
						$(thisThumb).attr(
							"src",
							data.responseJSON.thumbnail_url
						);
						$(thisThumb).css('opacity', '1');
						i++;
						next();
					}
				});
			}
		}
		// kick off the first thumb iteration
		next();

		//placeholder thumb
		if ($vimeoPlaceholder.length > 0) {
			var vimeoID = $vimeoPlaceholder.attr("data-video-id");

			$.ajax({
				url: "https://vimeo.com/api/oembed.json?url=https://vimeo.com/" + vimeoID,
				dataType: "json",
				success: function(data) {
					var img = data.thumbnail_url.split('_')[0]  + "_1280.jpg";
					$vimeoPlaceholder.attr("src", img);
					$vimeoPlaceholder.css('opacity', '1');
				}
			});
		}
	}

  vimeoThumbs();

	$videoStage.find('.js-lazy-iframe').each(function() {
		$(this).attr("src", $(this).data('src')).removeAttr('data-src');
	});

	theme.LibraryLoader.load('plyr', function() {
		theme.LibraryLoader.load('plyrShopifyStyles', function() {
			$videoStage.find('.js-home-video-player').each(function() {
				var video = this;
				var videoId = $(video).attr("id");

				//setup each player with unique var
				window[videoId] = new Plyr(video, {
					controls: [
						'play',
						'progress',
						'mute',
						'volume',
						'fullscreen'
					],
					youtube: { noCookie: false },
					loop: {
						active: false
					},
					hideControlsOnPause: true,
					iconUrl: '//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg',
					tooltips: {
						controls: false,
						seek: true
					}
				});

				//array of all players for mass functions
				theme.homeVideoGalleryPlayers.push(window[videoId]);
			});
		});
	});
};

theme.homeVideoGallery = function() {
	var $videos = $('.js-home-video-stage');

	var homeVideoGalleryObserver = generateFireOnViewObserver(theme.homeVideoGalleryInit);

	if ($videos.length > 0) {
		if (homeVideoGalleryObserver && !Shopify.designMode) {
			$videos.each(function() {
				homeVideoGalleryObserver.observe(this);
			});
		} else {
			$videos.each(function() {
				theme.homeVideoGalleryInit(this);
			});
		}
	}

  //placeholder click
  $(document).on('click', '.js-home-video-placeholder-trigger', function(e) {
		e.preventDefault();

		var triggerTarget = $(this).attr("href");
		var triggerId = $(this)
			.attr("href")
			.replace(/#/, "");

		//hide placeholder
		$(this)
			.parent(".js-home-video-placeholder")
			.addClass("js-hidden");

		//pause all videos if playing
		theme.homeVideoGalleryPlayers.forEach(function(instance) {
			instance.pause();
		});

		//start video
		window["home_player_" + triggerId].play();

		$( ".home-video__stage-video .plyr__controls" ).css( "display", "flex" );
  });

  //thumbs click
  $(document).on('click', '.js-home-video-trigger', function(e) {
		e.preventDefault();

		var triggerId = $(this)
			.attr("href")
			.replace(/#/, "");
		var triggerTarget = "#js-home-video-" + triggerId;
		var sectionPlaceholder = $(this)
			.parents(".home-video")
			.find(".js-home-video-placeholder");

		//hide placeholder
		sectionPlaceholder.addClass("js-hidden");

		//remove and add active class
		$(this)
			.parents(".home-video")
			.find(".js-home-video")
			.removeClass("js-active");
		$(triggerTarget).addClass("js-active");

		//pause all videos
		theme.homeVideoGalleryPlayers.forEach(function(instance) {
			instance.pause();
		});

		//pause on second click and play function
		if (
			$(this)
			.parent()
			.hasClass("js-paused")
		) {
			window["home_player_" + triggerId].play();
			$(this)
			.parent()
			.removeClass("js-paused");
		} else if (
			$(this)
			.parent()
			.hasClass("js-active")
		) {
			$(this)
			.parent()
			.addClass("js-paused");
		} else {
			// console.log(window["home_player_" + triggerId]);
			window["home_player_" + triggerId].play();
		}

		//set correct thumb to active
		$(".js-home-video-trigger")
			.parent()
			.removeClass("js-active");
		$(".js-home-video-trigger")
			.parent()
			.removeClass("js-init");
		$(this)
			.parent()
			.addClass("js-active");
  });
};

theme.masonryLayout = function() {
	// Masonry layout init
	if (document.querySelector('.o-layout--masonry') !== null) {

		theme.LibraryLoader.load(
			'masonry',
			masonryInit
		);
	}

	function masonryInit() {
		$(".o-layout--masonry")
		.imagesLoaded()
		.always(function(instance) {
			$(".o-layout--masonry").masonry({
				itemSelector: ".o-layout__item",
				transitionDuration: 0
			});

			//reset scroll reveal geometry
			if (window.sr) window.sr.delegate();
		})
		// Run masonry while loading images
		.progress(function(instance, image) {
			$(".o-layout--masonry").masonry({
				itemSelector: ".o-layout__item",
				transitionDuration: 0
			});

			//reset scroll reveal geometry
			if (window.sr) window.sr.delegate();
		});
	}
};

theme.animScroll = function() {
  if ($("body").data("anim-load")) {
		theme.intervalStyle = {};

		if ($("body").data("anim-interval-style") == "fade_down") {
			theme.intervalStyle = "-20px";
		} else if ($("body").data("anim-interval-style") == "fade_up") {
			theme.intervalStyle = "20px";
		} else {
			theme.intervalStyle = "0";
		}

		theme.intervalValue = {};
		if ($("body").data("anim-interval")) {
			theme.intervalValue = 100;
		} else {
			theme.intervalValue = 0;
		}

		var config = {
			viewFactor: 0.1,
			duration: 600,
			distance: theme.intervalStyle,
			scale: 1,
			delay: 0,
			mobile: true,
			useDelay: "once",
			beforeReveal: function myCallback(el) {
				$(el).addClass("js-sr-loaded");
			}
		};

		window.sr = new ScrollReveal(config);

		//elements
		sr.reveal(".section__title", { distance: "5px" });
		sr.reveal(".section__title-desc", { distance: 0, delay: 100 });
		sr.reveal(".newsletter, .section__link, .account", { distance: 0 });
		sr.reveal(".collection-list__item", {
			interval: theme.intervalValue
		});

		//cart
		sr.reveal(".cart .section__title", { distance: "20px" });
		sr.reveal(".cart__content", { distance: 0, delay: 100 });

		//search
		sr.reveal(".search-page .section__title", { distance: "20px" });
		sr.reveal(".search-page__form, .search-page__info, .search-page-pagination", {
			distance: 0,
			delay: 100
		});
		sr.reveal(".search-page .product-card-top, .search-grid-item", {
			interval: theme.intervalValue,
			delay: 0
		});

		//blog
		sr.reveal(".blog", { delay: 100, interval: theme.intervalValue });
		sr.reveal(".blog-page__tags, .blog-pagination", {
			distance: 0,
			delay: 100
		});
		sr.reveal(".blog-page .section__title", { distance: "20px" });

		//article
		sr.reveal(".article .section__title", { distance: "20px" });
		sr.reveal(".article__date", { distance: "-10px", delay: 200 });
		sr.reveal(".article__featured-media, .article__content", {
			distance: 0,
			delay: 100
		});
		sr.reveal(".article__meta, .article-paginate", { distance: 0 });

		//collection page
		sr.reveal(".collection__header-info__title", { distance: "20px" });
		sr.reveal(".collection .product-card-top", { interval: theme.intervalValue });
		sr.reveal(
			".collection__header-media, .collection__header-info__text, .collection-empty, .collection-pagination, .collection__filters-active",
			{ distance: 0, delay: 100 }
		);

		//collection list
		sr.reveal(".list-collections .section__title", { distance: "20px" });
		sr.reveal(".list-collections .collection-list__item", {
			interval: theme.intervalValue,
			delay: 100
		});

		//product page
		sr.reveal(".product-single__title-text", { distance: "20px" });
		sr.reveal(
			".product-single__title-desc, .breadcrumb, .product-single__photos, .product-single__content, .product-single--minimal .product-single__content-text",
			{ distance: 0, delay: 100, useDelay: "onload" }
		);

		//page
		sr.reveal(".page .section__title", { distance: "20px" });
		sr.reveal(".faq__cta", { distance: 0, delay: 100 });
		sr.reveal(".faq__accordion", { distance: 0, delay: 200 });
		sr.reveal(".faq__category__title", { distance: 0 });
		sr.reveal(".page__contact-form", { distance: 0, delay: 100 });

		//sections
		sr.reveal(".home-carousel .section__title", { distance: 0 });
		sr.reveal(".home-image-grid__item", { interval: theme.intervalValue });
		sr.reveal(".home-promo__box");
		sr.reveal(".home-intro", { distance: 0 });
		sr.reveal(
			".home-intro__media, .home-intro__text, .home-intro__video, .home-intro__link-wrap"
		);
		sr.reveal(".home-logo-list__items", { distance: 0 });
		sr.reveal(".home-testimonials", { distance: 0 });

		sr.reveal(".product-featured__photo-wrapper", { distance: 0, delay: 100 });
		sr.reveal(".home-event__item", { interval: theme.intervalValue }); //aslo in eventFeed secion for ajax
		sr.reveal(".home-delivery", { distance: 0 });
		sr.reveal(".home-delivery__content", { distance: theme.intervalStyle });
		sr.reveal(".home-map__items");
		sr.reveal(".home-rich-text__content", { distance: 0, delay: 100 });
		sr.reveal(".home-inline__item", { interval: theme.intervalValue });
		sr.reveal(".home-video__stage, .home-video__items", { distance: 0 });
		sr.reveal(".home-custom__item", { interval: theme.intervalValue });

		sr.reveal(".product-card-top", { interval: theme.intervalValue });

  }
};

// TODO: Move init into intersection observer
theme.thumbsCarousel = function() {
	// Resize background of the single product classic view slideshow
	function resizeProductBg($sliderElement, newPhotoHeight) {

		if ($(".product-single").hasClass("product-single--classic")) {
			var $productBg = $(".js-product-bg");

			if ($productBg.hasClass("js-product-bg--full")) {
				heightFraction = 1;
			} else {
				heightFraction = 0.55;
			}

			var photoHeight = newPhotoHeight || $sliderElement.find(".slick-list").height();

			var thumbsHeight = 0;
			var $sliderDots = $(".js-product-slider-nav .slick-dots");

			if ($sliderDots.length) {
				thumbsHeight = $sliderDots.outerHeight(true);
			}

			var breadcrumbHeight = 0;
			var $breadcrumbs = $('.js-breadcrumb');

			if ($breadcrumbs.length) {
				breadcrumbHeight = $breadcrumbs.outerHeight(true);
			}

			var viewInSpaceBtnHeight = 0;
			var $viewInSpaceBtn = $('.js-product-view-in-space-btn');

			if ($viewInSpaceBtn.length > 0 && !$viewInSpaceBtn.is('[data-shopify-xr-hidden]')) {
				viewInSpaceBtnHeight = $viewInSpaceBtn.outerHeight(true);
			}

			var newPhotoBgScale = (photoHeight *
				heightFraction +
				thumbsHeight +
				breadcrumbHeight +
				viewInSpaceBtnHeight +
				60) / $productBg.height();

			$productBg.css('transform', 'scaleY(' + newPhotoBgScale + ')');

		}
	}

	function initiateSlick($sliderElement) {

		$sliderElement.on('init', function() {
			var $sliderWrapper = $sliderElement.parent();

			$sliderWrapper.removeClass('product-single__photos--loading');
			$sliderWrapper.find('.product-single__photo__nav').removeClass('product-single__photo__nav--loading');
			$sliderElement.removeClass('product-single__photo--loading');

			resizeProductBg($sliderElement);
		});

		$sliderElement.slick( {
			focusOnSelect: true,
			accessibility: true,
			ariaPolite: false,
			slidesToShow: 1,
			slidesToScroll: 1,
			infinite: false,
			arrows: true,
			dots: true,
			swipe: true,
			fade: true,
			adaptiveHeight: true,
			speed: 300,
			cssEase: "ease",
			lazyLoad: "progressive",
			prevArrow:
			'<div class="product-single__photo__nav__item product-single__photo__nav__item--prev"><i class="icon icon--left-l"></i></div>',
			nextArrow:
			'<div class="product-single__photo__nav__item product-single__photo__nav__item--next"><i class="icon icon--right-l"></i></div>',
			customPaging: function(slider, i) {
				return (
					'<button><div class="product-single__photo-thumbs__item">' +
					$(".js-product-single-thumbs div:nth-child(" + (i + 1) + ")").html() +
					"</div></button>"
				);
			},
			appendDots: $sliderElement.parent().find('.js-product-slider-nav-dots'),
			responsive: [{
				breakpoint: 768,
				settings: {
					appendArrows: $sliderElement.parent().find('.js-product-slider-nav')
				}
			}]
		})
		.on('beforeChange', function(event, slick, currentSlide, nextSlideIndex) {
			resizeProductBg($sliderElement, $($sliderElement.find('.slick-slide')[nextSlideIndex]).height());
		});
	}

  $(".js-section__product-single .js-product-slider").not(".slick-initialized").each( function() {
		var $sliderElement = $(this);
		var $firstSliderImage = $sliderElement.find('.product-single__photo__wrapper').first().find('img').first();

		if ($firstSliderImage.length > 0) {
			// TODO: The product slider is a weird beast – hidden by default,
			// then inserted where needed. Maybe rethink to keep in one place?
			$firstSliderImage.one('load', function() {
				initiateSlick($sliderElement);
			}).each(function() {
				if(this.complete) $(this).trigger('load');
			});
		} else {
			$(function initiateCarouselOnDomReady() {
				initiateSlick($sliderElement);
			});
		}
	});
};

// ====================
// Logos carousel logic
// ====================
theme.logoCarouselUpdate = function(element) {
	var $carousel = $(element);

	//get sizes
	var winWidth = $(window).width();

	var slideCount = $carousel.data("carouselCount");

	var desktop = $carousel.data("carouselDesktop");
	var mobile = $carousel.data("carouselMobile");

  function logoCarouselInitFull($carousel, slideCount) {
		$carousel.not(".slick-initialized").slick({
			slidesToShow: slideCount,
			slidesToScroll: slideCount,
			arrows: true,
			dots: true,
			fade: false,
			adaptiveHeight: false,
			speed: 300,
			cssEase: "ease",
			lazyLoad: "progressive",
			prevArrow:
			'<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
			nextArrow:
			'<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next"><i class="icon icon--right-l"></i></div>',
			responsive: [
			{
				breakpoint: theme.mobileBrkp,
				settings: {
				swipeToSlide: true,
				variableWidth: true,
				slidesToShow: 1,
				slidesToScroll: 1
				}
			}
			]
		});
  }

  function logoCarouselInitDesk($carousel, slideCount) {
		$carousel.not(".slick-initialized").slick({
			slidesToShow: slideCount,
			slidesToScroll: slideCount,
			arrows: true,
			dots: true,
			fade: false,
			adaptiveHeight: false,
			speed: 300,
			cssEase: "ease",
			lazyLoad: "progressive",
			prevArrow:
			'<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
			nextArrow:
			'<div class="home-logo-list-carousel__nav home-logo-list-carousel__nav--next"><i class="icon icon--right-l"></i></div>'
		});
  }

  function logoCarouselInitMobile($carousel) {
		$carousel.not(".slick-initialized").slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			swipeToSlide: true,
			variableWidth: true,
			arrows: false,
			dots: true,
			fade: false,
			adaptiveHeight: false,
			speed: 300,
			cssEase: "ease",
			lazyLoad: "progressive"
		});
	}

	$carousel.removeClass('home-logo-list-carousel--loading');

	if (desktop && mobile) {
		logoCarouselInitFull($carousel, slideCount);
	} else if (desktop) {
		if (winWidth >= theme.mobileBrkp) {
			logoCarouselInitDesk($carousel, slideCount);
		} else {
			//check if slick is initiated
			if ($carousel.hasClass("slick-initialized")) {
				//detach slick
				$carousel.slick("unslick");
			}
		}
	} else if (mobile) {
		if (winWidth < theme.mobileBrkp) {
			logoCarouselInitMobile($carousel);
		} else {
			//check if slick is initiated
			if ($carousel.hasClass("slick-initialized")) {
				//detach slick
				$carousel.slick("unslick");
			}
		}
	}
};

theme.logoCarouselInit = function(element) {
	theme.logoCarouselUpdate(element);

	$(window).on('resize', function updateLogoCarouselOnResize() {
		theme.logoCarouselUpdate(element);
	});
};

theme.logoCarousel = function() {
	var $carousels = $(".js-home-logo-list-carousel");

	var logoCarouselObserver = generateFireOnViewObserver(theme.logoCarouselInit);

	if ($carousels.length > 0) {
		$carousels.each(function() {
			var carousel = this;
			if (logoCarouselObserver && !Shopify.designMode) {
				logoCarouselObserver.observe(carousel);
			} else {
				theme.logoCarouselInit(carousel);
			}
		});
	}
};

// ===========================
// Testimonials carousel logic
// ===========================

theme.testimonialsCarouselUpdate = function(carouselElement) {
	//get sizes
	winWidth = $(window).width();

	var $carousel = $(carouselElement);

	desktop = $carousel.data("carouselDesktop");
	mobile = $carousel.data("carouselMobile");

	$carousel.removeClass('home-testimonials-carousel--loading');

	function initCarousel($carouselElement) {

		$carouselElement.not(".slick-initialized").slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			arrows: true,
			dots: true,
			fade: false,
			adaptiveHeight: false,
			speed: 300,
			cssEase: "ease",
			lazyLoad: "progressive",
			prevArrow:
			'<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--prev"><i class="icon icon--left-l"></i></div>',
			nextArrow:
			'<div class="home-testimonials-carousel__nav home-testimonials-carousel__nav--next"><i class="icon icon--right-l"></i></div>'
		});
	}

	if (desktop && mobile) {
		initCarousel($carousel);
	} else if (desktop) {
		if (winWidth >= theme.mobileBrkp) {
			initCarousel($carousel);
		} else {
			//check if slick is initiated
			if ($carousel.hasClass("slick-initialized")) {
				//detach slick
				$carousel.slick("unslick");
			}
		}
	} else if (mobile) {
		if (winWidth < theme.mobileBrkp) {
			initCarousel($carousel);
		} else {
			//check if slick is initiated
			if ($carousel.hasClass("slick-initialized")) {
				//detach slick
				$carousel.slick("unslick");
			}
		}
	}
};

theme.testimonialsCarouselInit = function(carouselElement) {
	// if (!$(carouselElement).hasClass("slick-initialized")) {
		theme.testimonialsCarouselUpdate(carouselElement);

		$(window).on('resize', function() {
			theme.testimonialsCarouselUpdate(carouselElement);
		});
	// }
};

theme.testimonialsCarousel = function() {
	var carousels = $(".js-home-testimonials-carousel");

	var testimonialsCarouselObserver = generateFireOnViewObserver(theme.testimonialsCarouselInit);

	carousels.each(function() {
		var carousel = this;
		if (testimonialsCarouselObserver && !Shopify.designMode) {
			testimonialsCarouselObserver.observe(carousel);
		} else {
			theme.testimonialsCarouselInit(carousel);
		}
	});
};

theme.headerScrollUp = function headerScrollControl() {
	function hasScrolled() {
		var st = $(this).scrollTop();

		// Make sure to scroll more than delta
		if(Math.abs(lastScrollTop - st) <= delta)
			return;

		// If scrolled down and are past the navbar, add class .nav-up.
		// This is necessary so you never see what is "behind" the navbar.
		if (st > lastScrollTop && st > navbarHeight){// Scroll Down
			$(body).removeClass('header-down').addClass('header-up');
		} else {// Scroll Up
			$(body).removeClass('header-up').addClass('header-down');
		}
		lastScrollTop = st;
	}

	if ($(".js-header").hasClass("js-header-scroll")) {
		// Hide Header on on scroll down
		var didScroll;
		var lastScrollTop = 0;
		var delta = 5;
		var navbarHeight = $('.js-header').outerHeight() + 50;

		$(window).on('scroll', function(event){
			didScroll = true;
		});

		setInterval(function() {
			if ($(".js-header").hasClass("js-header-scroll")) {
				if (didScroll) {
					hasScrolled();
					didScroll = false;
				}
			}
		}, 250);
	}
};

theme.accordion = function() {
  var item = $(".js-accordion-info");
  var trigger = $(".js-accordion-trigger");
  var items = item.hide(); //hide all items
  var activeClass = "js-active";
  var defaultOpenClass = "js-accordion-trigger-default-open";

  //open by default 
  for (var i = trigger.length - 1; i >= 0; i--) {
  	if ($(trigger[i]).hasClass(defaultOpenClass)) {
  		var thisItem = $(trigger[i]).attr("href");

  		//open and activate this item
		$(thisItem)
		.addClass(activeClass)
		.stop()
		.slideDown();
		$(trigger[i]).addClass(activeClass).attr("aria-expanded", "true");
  	}
  }

  //click
  trigger.on('click', function() {
		var thisItem = $(this).attr("href");
		var reviewsTab = $("#acc-reviews").length != 0;

		//recalculate single product fixed box position on accordion changes
		//added delay to wait for accordion to finish animating
		setTimeout(function() {
			$(".js-product-single-box").trigger("resize");
		}, 400);

		//review stars scroll and open
		if ($(this).hasClass("js-accordion-scroll")) {
			if(reviewsTab){
				var outsideAccordion = $(".js-accordion").find(
					"[href='" + $(this).attr("href") + "']"
				);

				//check if sticky header and set correct offset
				if ($(".js-header").hasClass("js-header-sticky")) {
					scrollOffset = $(".js-header").outerHeight() + 18;
				} else {
					scrollOffset = 18;
				}

				//scroll
				$("html,body").animate(
				{
					scrollTop: outsideAccordion.offset().top - scrollOffset
				},
				800
				);

				//open accordion
				$(thisItem)
				.addClass(activeClass)
				.stop()
				.slideDown();
				outsideAccordion.addClass(activeClass);
			}

			return false;
		}

		//check if clicked is active
		if ($(thisItem).hasClass(activeClass)) {
			//close current item
			$(this).removeClass(activeClass).attr("aria-expanded", "false");
			$(thisItem)
			.removeClass(activeClass)
			.stop()
			.slideUp();
		} else {
			//open and activate this item
			$(thisItem)
			.addClass(activeClass)
			.stop()
			.slideDown();
			$(this).addClass(activeClass).attr("aria-expanded", "true");
		}

		return false;
  });
};

//animated scroll to div ID
theme.scrollToDiv = function() {
  $(".js-scroll-id").on('click', function(e) {
		var thisId = $(this).attr("href");

		//check for the offset
		if ($(".js-header").hasClass("js-header-sticky")) {
			scrollOffset = $(".js-header").outerHeight() + 18;
		} else {
			scrollOffset = 18;
		}

		//scroll
		$("html,body").animate(
			{
			scrollTop: $(thisId).offset().top - scrollOffset
			},
			800
		);

		return false;
  });
};

//localize popup toggle
theme.localizeToggle = function() {
  var box = $(".js-localize-box");
  var trigger = $(".js-localize-trigger");
  var item = $(".js-localize-item");
  var activeClass = "js-active";

  item.on('click', function() {
  	var value = $(this).data('value');

    $(this).parents('.js-localize-wrapper').find("[data-disclosure-input]").val(value);
    $(this).parents('form').trigger('submit');

    return false;
  });

  trigger.on('click', function() {

	var thisTarget = $(this).parents('.js-localize-wrapper').find(box);

	if ($(this).hasClass(activeClass)) {
	  $(this).removeClass(activeClass).attr("aria-expanded", "false");
	  $(thisTarget).removeClass(activeClass);
	} else {
	  box.removeClass(activeClass);
      trigger.removeClass(activeClass).attr("aria-expanded", "false");

	  $(thisTarget).addClass(activeClass);
	  $(this).addClass(activeClass).attr("aria-expanded", "true");
	}

	return false;
  });

	//basic accessibility for keyboard
	box
		.on('focusin', function() {
		  $(this).addClass(activeClass);
		  $(this).parents('.js-localize-wrapper').find(trigger).addClass(activeClass).attr("aria-expanded", "true");
		})
		.on('focusout', function() {
		  $(this).removeClass(activeClass);
		  $(this).parents('.js-localize-wrapper').find(trigger).removeClass(activeClass).attr("aria-expanded", "false");
		});

  //click escape to close box and reset focus to trigger
	$(document).keyup(function(e) {
    if (e.key === "Escape" && box.hasClass('js-active')) {
  		box.removeClass(activeClass);
  		trigger.filter('.js-active')[0].focus();
			trigger.removeClass(activeClass).attr("aria-expanded", "false");
    }
	});

  //click outside elem to hide functions
  $(document).on('click', function(e) {
		if (!box.is(e.target) && box.has(e.target).length === 0) {
			box.removeClass(activeClass);
			trigger.removeClass(activeClass).attr("aria-expanded", "false");
		}
  });
};

//header nav functions
theme.headerNav = function() {
  var link = $(".js-header-sub-link");
  var tLink = $(".js-header-sub-t-link");
  var linkA = $(".js-header-sub-link-a");
  var tLinkA = $(".js-header-sub-t-a");
  var localizeWrapperClass = '.js-localize-wrapper';
  var activeClass = "js-active";

  var headerNavs = $(".js-heaver-navs");
  var mobileDraw = $(".js-mobile-draw-icon");
  var searchDraw = $(".js-search-draw-icon");
  var cartDraw = $(".js-cart-draw-icon");
  var primaryNav = $(".js-primary-nav");
  var secondaryNav = $(".js-secondary-nav");
	var logoImg = $(".js-main-logo");

	function updateHeaderNav() {
	  //get sizes
	  winWidth = $(window).width();
	  var navsWidth = headerNavs.width();
	  var primaryWidth = primaryNav.width();
	  var secondaryWidth = secondaryNav.width();
	  //calculate available space for primary nav
	  var navSpace = navsWidth / 2 - logoImg.width() / 2;
	  if (winWidth >= theme.mobileBrkp) {
			if (!$(".js-header").hasClass("header--center")) {
		  	if (navSpace < primaryWidth || navSpace < secondaryWidth) {
		  		$(".js-header").removeClass('header--inline-icons');
					mobileDraw.show();
					searchDraw.show();
					cartDraw.show();
					primaryNav.hide();
					secondaryNav.hide();
				} else {
					mobileDraw.hide();
					searchDraw.hide();
					cartDraw.hide();
					primaryNav.show();
					secondaryNav.show();
		  	}
			} else {
        $(".js-header").removeClass('header--inline-icons');
				mobileDraw.hide();
				searchDraw.hide();
				cartDraw.hide();
			}
	  } else {
			mobileDraw.show();
			searchDraw.show();
			cartDraw.show();
	  }
	}

	// Call function for the first time
	updateHeaderNav();

  //nav accessibility for keyboard
  link.not(localizeWrapperClass)
		.on('focusin', function() {
			$(this).addClass(activeClass);
			$(this).find(linkA).attr("aria-expanded", "true");
		});

	$(localizeWrapperClass).on('click', function() {
		$(this).addClass(activeClass);
		$(this).find(linkA).attr("aria-expanded", "true");

		return false;
	});
	//click escape to close open dropdown and reset focus to its trigger
	$(document).keyup(function(e) {
    if (e.key === "Escape" && $(localizeWrapperClass).hasClass(activeClass)) {
  		$(localizeWrapperClass)
  			.removeClass(activeClass)
  			.find('.js-header-sub-link-a.js-active')
  			.removeClass(activeClass)
  			.attr("aria-expanded", "false")
  			.focus();
    }
	});

	$('.js-nav-sub').on('focusin', function() {
	  	$(this.parentElement).addClass(activeClass);
	  	$(this).parent().find(linkA).addClass(activeClass).attr("aria-expanded", "true");
		})
		.on('focusout', function() {
	  	$(this.parentElement).removeClass(activeClass);
	  	$(this).parent().find(linkA).removeClass(activeClass).attr("aria-expanded", "false");
		});

  tLink.on('focusin', function() {
		tLink.removeClass(activeClass);
		tLinkA.attr("aria-expanded", "false");
		$(this).addClass(activeClass);
		$(this).find(tLinkA).attr("aria-expanded", "true");
  });
  link.on('mouseout', function() {
		$(this).removeClass(activeClass);
  });
  tLink.on('mouseout', function() {
		$(this).removeClass(activeClass);
  });

  //disable parent links
  $(".header--parent-disabled .js-header-sub-link-a, .header--parent-disabled .js-header-sub-t-a").on('click', function(e) {
		e.preventDefault();
  });

  //responsive events
	$(window).on('resize', updateHeaderNav);

  //calculate if third sub nav should appear on right ON MOUSEOVER
  tLink.on("mouseover focusin", function() {
		var subNavT = $(this).find(".js-nav-sub-t");
		//calc sub nav offset compared to window width
		var ofsNo = winWidth - (subNavT.offset().left + subNavT.width());
		//place subnav
		if (ofsNo < 1) {
			subNavT.css("right", "179px");
			subNavT.css("left", "auto");
		}
  });
};

theme.homeFeaturedCollection = function() {
	var featuredCollectionCarousels = document.querySelectorAll('.featured-collection--carousel');
	featuredCollectionCarousels.forEach(function(container) {
		initiateScroll(container.querySelectorAll('.featured-collection__nav--btn'), container.querySelector('.grid-layout'));
	});
};

// ==================================
// Home single product carousel logic
// ==================================
theme.homeFeaturedProductInit = function(productElement) {
	var $element = $(productElement);

	$element.on('init', function initFeaturedProductSlider() {
		$element.removeClass('product-featured__photo--loading');
	});

	$element.slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		accessibility: true,
		ariaPolite: false,
		arrows: true,
		dots: true,
		fade: true,
		adaptiveHeight: true,
		infinite: false,
		swipe: true,
		speed: 300,
		cssEase: "ease",
		prevArrow: '<div class="product-featured__photo__nav__item product-featured__photo__nav__item--prev"><i class="icon icon--left"></i></div>',
		nextArrow: '<div class="product-featured__photo__nav__item product-featured__photo__nav__item--next"><i class="icon icon--right"></i></div>',
		appendDots: $element.parent().find('.js-product-slider-nav-dots'),
		appendArrows: $element.parent().find('.js-product-slider-nav')
	});

	theme.homeProductMediaInit($element);
};

theme.homeFeaturedProduct = function() {
	var $homeFeatureProducts = $(".js-section__home-product .js-product-slider").not(".slick-initialized");

	var homeFeaturedProductObserver = generateFireOnViewObserver(theme.homeFeaturedProductInit);

	$homeFeatureProducts.each(function() {
		var product = this;
		if (homeFeaturedProductObserver && !Shopify.designMode) {
			homeFeaturedProductObserver.observe(product);
		} else {
			theme.homeFeaturedProductInit(product);
		}
	});
};

//toggle active class on target div
theme.triggerActive = function() {
  var trigger = $(".js-toggle-trigger");
  var activeClass = "js-active";

  trigger.on('click', function(e) {
		var thisTarget = $(this).attr("href");
		if ($(this).hasClass(activeClass)) {
			$(this).removeClass(activeClass);
			$(thisTarget).removeClass(activeClass);
			//accessibility
			$(this)
			.parent()
			.attr("aria-expanded", "false");
		} else {
			$(this).addClass(activeClass);
			$(thisTarget).addClass(activeClass);
			//accessibility
			$(this)
			.parent()
			.attr("aria-expanded", "true");
		}
		e.preventDefault();
  });
};

//check if two sections in row have backgrounds and if so collapse margin
theme.homeSectionMargin = function() {
  $(".main .shopify-section").each(function() {
		var thisSection = $(this).find(".section");

		//remove style attr for theme editor to display correctly without refresh
		thisSection.removeAttr("style");
		// TODO: Is it possible to move this to pure CSS?
		if (
			thisSection.hasClass("section--has-bg") &&
			$(this)
			.next()
			.find(".section")
			.is(".section--full-bg.section--has-bg")
		) {
			thisSection.css("margin-bottom", "0");
		}
  });
};

//age checker popup
theme.ageCheckerCookie = function() {
  var ageCookie = "age-checked";

  if ($(".js-age-draw").data("age-check-enabled")) {
	if (typeof Cookies != "undefined") {
	  if (Cookies(ageCookie) !== "1") {
		theme.mfpOpen("age");
	  }
	}
  }

  $(".js-age-close").on('click', function(e) {
		Cookies(ageCookie, "1", { expires: 14, path: "/" });
		$.magnificPopup.close();

		e.preventDefault();
  });
};

//promo popup
theme.promoPopCookie = function() {
  var promoCookie = "promo-showed";
  var promoDelay = $(".js-promo-pop").data("promo-delay");
  var promoExpiry = $(".js-promo-pop").data("promo-expiry");

  if ($(".js-promo-pop").data("promo-enabled")) {
		if (typeof Cookies != "undefined") {
			if (Cookies(promoCookie) !== "1") {
				setTimeout(function() {
					theme.promoPop("open");
				}, promoDelay);
			}
		}
  }

  $(".js-promo-pop-close").on('click', function(e) {
		Cookies(promoCookie, "1", { expires: promoExpiry, path: "/" });
		theme.promoPop("close");

		e.preventDefault();
  });
};

theme.footerTweet = function() {
  //set vars
  var twtEnable = $(".js-footer-tweet").data("footer-tweet-enable");

  if (twtEnable) {
	var twtUsername = $(".js-footer-tweet")
	  .data("footer-tweet-user")
	  .substring(1);

	//load twitter widgets JS
	window.twttr = (function(d, s, id) {
	  var js,
		fjs = d.getElementsByTagName(s)[0],
		t = window.twttr || {};

	  if (d.getElementById(id)) return t;
	  js = d.createElement(s);
	  js.id = id;
	  js.src = "https://platform.twitter.com/widgets.js";
	  fjs.parentNode.insertBefore(js, fjs);

	  t._e = [];
	  t.ready = function(f) {
		t._e.push(f);
	  };

	  return t;
	})(document, "script", "twitter-wjs");

	//load feed
	twttr.ready(function() {
	  twttr.widgets
		.createTimeline(
		  {
			sourceType: "profile",
			screenName: twtUsername
		  },
		  document.getElementById("footer-tweet"),
		  {
			tweetLimit: 1
		  }
		)
		.then(function(data) {
		  //get tweet and ass
		  var tweetText = $(data)
			.contents()
			.find(".timeline-Tweet-text")
			.html();
		  $(".js-footer-tweet-text").html(tweetText);
		});
	});
  }
};

//magnific popup functions
theme.mfpOpen = function(popup) {
  var closeBtn =
	'<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp" aria-label="close"><i class="icon icon--close"></i></button>';

  switch (popup) {
	case "cart":
	  if (theme.cart_ajax) {
	  	if (theme.cart_type == "modal") {
	  		$.magnificPopup.open({
			  items: {
				src: ".js-cart-draw"
			  },
			  type: "inline",
			  mainClass: "mfp-medium",
			  fixedContentPos: true,
			  midClick: true,
			  closeMarkup: closeBtn,
			  removalDelay: 200
			});
	  	} else {
	  		$.magnificPopup.open({
			  items: {
				src: ".js-cart-draw"
			  },
			  type: "inline",
			  alignTop: true,
			  mainClass: "mfp-notification",
			  fixedContentPos: false,
			  midClick: true,
			  closeMarkup: closeBtn,
			  removalDelay: 200,
			  closeOnBgClick: false,
			  callbacks: {
		          open: function(item) {
		          	var thisPopup = $.magnificPopup.instance;
		        	//automatic close
		            setTimeout(function(){
		            	if (thisPopup.isOpen) {
		               		thisPopup.close();
		               	}
		            }, 4000);
		          }
			  }
			});
	  	}
	  }
	  break;

	case "search":
	  $.magnificPopup.open({
		items: {
		  src: ".js-search-draw"
		},
		type: "inline",
		mainClass: "mfp-medium",
		fixedContentPos: true,
		focus: ".js-search-input",
		closeMarkup: closeBtn,
		removalDelay: 200
	  });
	  break;

	case "age":
	  $.magnificPopup.open({
		items: {
		  src: ".js-age-draw"
		},
		type: "inline",
		mainClass: "mfp-dark",
		fixedContentPos: true,
		modal: true,
		showCloseBtn: false,
		removalDelay: 200
	  });
	  break;

	case "menu-draw":
	  $.magnificPopup.open({
		items: {
		  src: ".js-menu-draw"
		},
		type: "inline",
		mainClass: "mfp-draw",
		fixedContentPos: true,
		closeMarkup: closeBtn,
		removalDelay: 200
	  });
	  break;

	case "store-availability-draw":
	  $.magnificPopup.open({
		items: {
		  src: ".js-store-availability-draw"
		},
		type: "inline",
		mainClass: "mfp-draw mfp-draw--right",
		fixedContentPos: true,
		closeMarkup: closeBtn,
		removalDelay: 200
	  });
	  break;

	case "collection-draw":
	  $.magnificPopup.open({
		items: {
		  src: ".js-collection-draw"
		},
		callbacks: {
		  resize: function() {
			if (winWidth >= theme.tabletBrkp) {
			  $.magnificPopup.close();
			}
		  }
		},
		type: "inline",
		mainClass: "mfp-draw",
		fixedContentPos: true,
		closeMarkup: closeBtn,
		removalDelay: 200
	  });
	  break;
  }
};

theme.collectionFormSubmit = function() {
	var formElement = document.querySelector('.collection-sidebar__filter-form');
	var sortElement = document.querySelector('.js-collection-sort');
	if (formElement !== null) {
		formElement.addEventListener('change', (e) => {
			e.target.form.classList.add("js-loading");
			e.target.form.submit();
		});
	} else if (sortElement !== null) {
		sortElement.addEventListener('change', (e) => {
			e.target.form.classList.add("js-loading");
			e.target.form.submit();
		});
	}
};

theme.priceRangeSlider = function() {

	const parent = document.querySelector('.price-range');
	if (!parent) {
		return;
	}
	const rangeS = parent.querySelectorAll('.price-range__input'),
	      numberS = parent.querySelectorAll('.price-range__number');			      

	rangeS.forEach((el) => {
		el.oninput = () => {

			let slide1 = parseFloat(rangeS[0].value),
				slide2 = parseFloat(rangeS[1].value);

			if (slide1 > slide2) {
				[slide1, slide2] = [slide2, slide1];
			}

			numberS[0].value = slide1;
			numberS[1].value = slide2;
		};
	});

	numberS.forEach((el) => {
		el.oninput = () => {
			let number1 = parseFloat(numberS[0].value),
				number2 = parseFloat(numberS[1].value);

			if (number1 > number2) {
				let tmp = number1;
				numberS[0].value = number2;
				numberS[1].value = tmp;
			}

			rangeS[0].value = number1;
			rangeS[1].value = number2;
		};
	});
};		

theme.magnificVideo = function() {
  $(".js-pop-video").magnificPopup({
	type: "iframe",
	mainClass: "mfp-medium mfp-close-corner",
	removalDelay: 200,
	closeMarkup:
	  '<button title="Close (Esc)" type="button" class="mfp-close mfp-close--custom js-close-mfp"><i class="icon icon--close"></i></button>'
  });
};

theme.productZoom = function() {
	if (document.querySelector('.js-pswp-zoom') !== null) {
		theme.LibraryLoader.load(
			'photoswipe',
			photoswipeInit
		);
	}

  function photoswipeInit() {
		var openPhotoSwipe = function(thisBtn, thisImageCount) {
		    var pswpElement = document.querySelectorAll('.pswp')[0];
		    var productGallery = $('.js-product-slider-single');

		    // build gallery array
		    var galleryItems = [];
		    $('.js-pswp-img').each(function() {
		      var smallSrc = $(this).prop('currentSrc') || $(this).prop('src');
		      var item = {
		      	msrc: smallSrc,
		        src: $(this).data('pswp-src'),
		        w: $(this).data('pswp-width'),
		        h: $(this).data('pswp-height'),
		        mediaId: $(this).data('media-id'),
		        el: $(this)[0]
		      };
		      galleryItems.push(item);
		    });

		    var options = {
		        history: false,
		        index: thisImageCount,
		        closeOnScroll: false,
		        getThumbBoundsFn: function() {
		            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
		            var thumbnail = galleryItems[thisImageCount].el;
		            var rect = thumbnail.getBoundingClientRect();
		            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
		        }
		    };

		    var pswpGallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, galleryItems, options);
		    pswpGallery.init();
		    pswpGallery.listen('close', function() {
		    	var thisSlideItem = $('.product-single__photo__item[data-media-id=' + this.currItem.mediaId + ']');
		    	productGallery.slick('slickGoTo', thisSlideItem[0].dataset.slideId);
		    });
		};

		$(document).on('click', '.js-pswp-zoom', function() {
			var thisBtn = $(this);
			var thisImageCount = $(this).data('image-count');
			openPhotoSwipe(thisBtn, thisImageCount);
		});
	}
};

theme.promoPop = function(action) {
  var popup = $(".js-promo-pop");
  var activeClass = "js-active";

  if (action == "open") {
	popup.addClass(activeClass);
  } else if (action == "close") {
	popup.removeClass(activeClass);
  }
};

theme.cartCheckbox = function() {
	$(document).on('click', '.js-cart-checkout-validate', function() {
		if ($('.js-cart-terms-input').is(':checked')) {
			$(this).trigger('submit');
		} else {
			var errorBox = $(this).parents('form').find('.js-cart-terms-error');
			errorBox.addClass('js-active');
			return false;
		}
	});
	$(document).on('change', '.js-cart-terms-input', function() {
        $('.js-cart-terms-error').removeClass('js-active');
    });
};

//functions to initiate ajax cart for the first time
theme.runAjaxCart = function() {
  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('iffirstnoteq', function (a, b, options) {
    if (a[0] != b) { return options.fn(this); }
    return options.inverse(this);
  });

  theme.ajaxCartInit();
  ajaxCart.load();
};

//product page recommendations
theme.productRecommendations = function() {
  // Look for an element with class 'js-product-recommendations'
  var productRecommendationsSection = document.querySelector('.js-product-recommendations');
  if (productRecommendationsSection === null) {return;}
  // Read product id from data attribute
  var productId = productRecommendationsSection.dataset.productId;
  // Read limit from data attribute
  var limit = productRecommendationsSection.dataset.limit;
  // Build request URL
  var requestUrl = productRecommendationsSection.dataset.url;
  // Create request and submit it using Ajax
  var request = new XMLHttpRequest();
  request.open('GET', requestUrl);
  request.onload = function() {
	if (request.status >= 200 && request.status < 300) {
	  var container = document.createElement('div');
	  container.innerHTML = request.response;
	  productRecommendationsSection.parentElement.innerHTML = container.querySelector('.js-product-recommendations').innerHTML;

	  //run ajax cart functions
	  theme.runAjaxCart();

	  // dynamic - dynamic checkout buttons
	  if (window.Shopify && Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }

	  //product swatches
	  theme.productCollSwatch();

	 //mobile carousel
	  $(".js-recommended-products").each(function(i) {
		var thisSectionId = $(this).data("section-id");
		// only run product select when modal enabled
		var modalEnabled = this.querySelectorAll('.js-product')[0].classList.contains('product-card--modal');

		if(modalEnabled){
			this.querySelectorAll('.js-product').forEach(function (card) {
				theme.productSelect(card.dataset.productId, thisSectionId, 'card', false);
			});
		}
	  });

	  //review stars
	  if (window.SPR) {
	    window.SPR.initDomEls();
	    window.SPR.loadBadges();
	  }

	  //reset scrolling animations
	  if ($("body").data("anim-load")) {
	  	if (typeof sr !== 'undefined') {
	  		sr.reveal('.section--recommended-products .product-card-top', { interval: theme.intervalValue });
			sr.reveal('.section--recommended-products .section__title', { distance: "5px" });
	  	}
	  }

	  theme.quickShopModal();

	  theme.productGridImageObserver();

	  var productRecommendationsCarousels = document.querySelectorAll('.recommended-products--carousel');

		productRecommendationsCarousels.forEach(function(container) {
			initiateScroll(document.querySelectorAll('.recommended-products__nav--btn'), container.querySelector('.grid-layout'));
		});
	}
  };
  request.send();
};

//product page complementary block
theme.productComplementary = function() {

  // Look for an element with class 'js-product-recommendations'
  var productComplementarySection = document.querySelector('.js-complementary-products');
  if (productComplementarySection === null) {return;}
  // Build request URL
  var requestUrl = productComplementarySection.dataset.url;
  // Create request and submit it using Ajax

  var request = new XMLHttpRequest();
  request.open('GET', requestUrl);
  request.onload = function() {
	  if (request.status >= 200 && request.status < 300) {
	    var container = document.createElement('div');

	    container.innerHTML = request.response;

	    productComplementarySection.innerHTML = container.querySelector('.js-complementary-products').innerHTML;

	    //carousel
	    $('.js-complementary-products-carousel').not(".slick-initialized").slick({
				slidesToShow: 2,
				slidesToScroll: 2,
				arrows: true,
				dots: true,
				infinite: false,
				speed: 300,
				cssEase: "ease",
				prevArrow:
				'<div class="complementary-products-carousel__nav-item complementary-products-carousel__nav-item--prev"><i class="icon icon--left-l"></i></div>',
				nextArrow:
				'<div class="complementary-products-carousel__nav-item complementary-products-carousel__nav-item--next"><i class="icon icon--right-l"></i></div>',
				appendDots: $('.js-complementary-products-carousel').parent().find('.js-complementary-products-carousel-nav-dots'),
				appendArrows: $('.js-complementary-products-carousel').parent().find('.js-complementary-products-carousel-nav')
			});

			//accordion logic
		  var accordionContent = $(".js-complementary-products-accordion-content");
		  var accordionTrigger = $(".js-complementary-products-accordion-trigger");
		  var activeClass = "js-active";

		  var defaultOpenClass = "js-accordion-trigger-default-open";

		  //close by default so accordion animations on fist click
		  accordionContent.hide();

		  //open by default 
		  for (var i = accordionTrigger.length - 1; i >= 0; i--) {
		  	if ($(accordionTrigger[i]).hasClass(defaultOpenClass)) {
		  		var thisItem = $(accordionTrigger[i]).attr("href");

		  		//open and activate this item
					$(thisItem)
					.addClass(activeClass)
					.stop()
					.slideDown();
					$(accordionTrigger[i]).addClass(activeClass).attr("aria-expanded", "true");
		  	}
		  }

		  accordionTrigger.on('click', function() {
				var thisItem = $(this).attr("href");

				//check if clicked is active
				if ($(thisItem).hasClass(activeClass)) {
					//close current item
					$(this).removeClass(activeClass).attr("aria-expanded", "false");
					$(thisItem)
					.removeClass(activeClass)
					.stop()
					.slideUp();
				} else {
					//open and activate this item
					$(thisItem)
					.addClass(activeClass)
					.stop()
					.slideDown();
					$(this).addClass(activeClass).attr("aria-expanded", "true");
				}

				return false;
		  });

	    //add to cart functions
	    var complementaryItems = $('.complementary-products-carousel__item');
	    for (var u = 0; u < complementaryItems.length; u++) {
	    	var formId = $(complementaryItems[u]).find('form').attr('id');
	    	ajaxCart.specificFormOverride('#' + formId);
	    }

	  }
  };

  //complementary block initial add delay request in the theme editor
  //otherwise Shopify request might return an empty block
  if (Shopify.designMode) {
  	setTimeout(function() {
  		request.send();
  	}, window.theme.complementary_products_fetch_delay);
  } else {
  	request.send();
  }
  
};

// ======================
// Carousel - Scroll Snap 
// ======================
function _defineProperty(obj, key, value) {
	if (key in obj) {
		Object.defineProperty(obj, key, {
			value: value,
			enumerable: true,
			configurable: true,
			writable: true
		});
	} else {
		obj[key] = value;
	}
	return obj;
}
var easingOutQuint = function easingOutQuint(x, t, b, c, d) {
	return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
};
function smoothScrollPolyfill(node, key, target) {
	var startTime = Date.now();
	var offset = node[key];
	var gap = target - offset;
	var duration = 5000;
	var interrupt = false;
	var step = function step() {
		var elapsed = Date.now() - startTime;
		var percentage = elapsed / duration;
		if (interrupt) {
			return;
		}
		if (percentage > 1) {
			cleanup();
			return;
		}
		node[key] = easingOutQuint(0, elapsed, offset, gap, duration);
		requestAnimationFrame(step);
	};
	var cancel = function cancel() {
		interrupt = true;
		cleanup();
	};
	var cleanup = function cleanup() {
		node.removeEventListener('wheel', cancel);
		node.removeEventListener('touchstart', cancel);
	};
	node.addEventListener('wheel', cancel, { passive: true });
	node.addEventListener('touchstart', cancel, { passive: true });
	step();
	return cancel;
}
/*
  Safari doesn’t support smooth scroll behavior and Edge doesn’t support scrollTo() at all.
  Detect support and fall back to a js implementation.
  */
  function testSupportsSmoothScroll() {
  	var supports = false;
  	try {
  		var div = document.createElement('div');
  		div.scrollTo({
  			top: 0,
  			get behavior() {
  				supports = true;
  				return 'smooth';
  			}
  		});
  } catch (err) {} // Edge throws an error
  return supports;
}
var hasNativeSmoothScroll = testSupportsSmoothScroll();
function smoothScroll(node, topOrLeft, horizontal) {
	if (hasNativeSmoothScroll) {
		var _node$scrollTo;
		return node.scrollTo((_node$scrollTo = {}, _defineProperty(_node$scrollTo, horizontal ? 'left' : 'top', topOrLeft), _defineProperty(_node$scrollTo, 'behavior', 'smooth'), _node$scrollTo));
	} else {
		return smoothScrollPolyfill(node, horizontal ? 'scrollLeft' : 'scrollTop', topOrLeft);
	}
}
function debounce(func, ms) {
	var timeout = void 0;
	return function () {
		clearTimeout(timeout);
		timeout = setTimeout(function () {
			timeout = null;
			func();
		}, ms);
	};
}
function setAriaPressed(index, indicators) {
	indicators.forEach(function (indicator, i) {
		if(i===index){
			indicator.setAttribute('aria-pressed', true);
			if(!indicator.classList.contains('active')){
				indicator.classList.add('active');
			}
		} else {
			indicator.setAttribute('aria-pressed', false);
			if(indicator.classList.contains('active')){
				indicator.classList.remove('active');
			}
		}
	});
}
function initiateScroll(indicators, scroller) {
	indicators.forEach(function (indicator, i) {
		indicator.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			setAriaPressed(i, indicators);
			var scrollLeft = Math.floor(scroller.scrollWidth * (i / indicators.length));
			smoothScroll(scroller, scrollLeft, true);
		});
	});
	scroller.addEventListener('scroll', debounce(function () {
		var index = Math.round(scroller.scrollLeft / scroller.scrollWidth * indicators.length);
		setAriaPressed(index, indicators);
	}, 50));
}

// ======================
// Quickbuy modal logic
// ======================
theme.quickShopModal = function() {

	// when function is called multiple times by editor.js
	// check if overlay active
	var activeOverlay = document.querySelector('.quick-shop-overlay.active');
	// close overlay
	if(activeOverlay !== null){
		activeOverlay.classList.remove("active");
	}

	var productCards = document.querySelectorAll('.product-card--modal');
	var quickShopOverlay = document.querySelector('.quick-shop-overlay');
	var htmlDoc = document.querySelector('html');

	productCards.forEach(function (card) {

		var quickShopModal = card.querySelector('.quick-shop');
		var quickShopTrigger = card.querySelector('.quick-shop__trigger');
		var quickShopClose = card.querySelector('.quick-shop__close');

	  	// open via quickbuy btn
	  	quickShopTrigger.onclick=function() {
	  		quickShopModal.classList.add("active");
	  		quickShopOverlay.classList.add("active");
	  		htmlDoc.classList.add("scroll-disabled");
	  	};
	  	// close via close btn
	  	quickShopClose.onclick=function() {
	  		card.querySelector('.quick-shop.active').classList.remove("active");
	  		quickShopOverlay.classList.remove("active");
	  		htmlDoc.classList.remove("scroll-disabled");
	  	};
  	});
  // close via overlay - add eventlistener if exists
	if(quickShopOverlay){
	  quickShopOverlay.onclick=function() {
	  	document.querySelector('.quick-shop.active').classList.remove("active");
	  	quickShopOverlay.classList.remove("active");
	  	htmlDoc.classList.remove("scroll-disabled");
	  };
	}

};

// ======================
// Home event feeds logic
// ======================
theme.homeEventFeeds = function() {
	var feeds = document.querySelectorAll('.js-events');

	function initEventFeed(element) {
		var thisSectionId = $(element).data("section-id");
		var thisApiKey = $(element).data("api-key");
		theme.eventFeed(
			thisApiKey,
			"#eventTemplate" + thisSectionId,
			"#eventContainer" + thisSectionId,
			thisSectionId
		);
	}

	var homeEventFeedObserver = generateFireOnViewObserver(initEventFeed);

	if (feeds.length > 0) {
		feeds.forEach(function(element) {
			if (homeEventFeedObserver && !Shopify.designMode) {
				homeEventFeedObserver.observe(element);
			} else {
				initEventFeed(element);
			}
		});
	}
};

/*============================================================================
  Run main theme functions
==============================================================================*/

//Open AJAX cart after new item is added
$("body").on("afterAddItem.ajaxCart", function() {
	setTimeout(function() {
	  theme.mfpOpen("cart");
	}, 100);
});

//wait for TAB to be clicked and add class for outline accessible class
function tabClick(e) {
	if (e.keyCode === 9) {
	  body.addClass('js-using-tab');
	  window.removeEventListener('keydown', tabClick);
	}
}
window.addEventListener('keydown', tabClick);

//mobile sliders
document.querySelectorAll('.js-page-products').forEach(function setProductsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
	theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-home-testimonials').forEach(function setHomeTestimonialsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
	theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-home-collection-list').forEach(function setHomeCollectionListLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
	theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});
document.querySelectorAll('.js-events-onboarding').forEach(function setEventsLayout(element, index) {
    var thisSectionId = $(element).data("section-id");
	theme.layoutSlider(".js-layout-slider-" + thisSectionId);
});

//fitvids
$(".video-wrapper").fitVids();
//rich text fitvids
$('.rte iframe[src*="youtube"]')
.parent()
.fitVids();
$('.rte iframe[src*="vimeo"]')
.parent()
.fitVids();

//rich text table overflow
$(".rte table").wrap(
"<div style='overflow:auto;-webkit-overflow-scrolling:touch'></div>"
);

//move cart box for classic layout 
$(".js-product-cart-replace").appendAround();
//move product gallery for classic layout
$(".js-product-gallery-replace").appendAround();

//search popup trigger click
$(document).on("click touchend", ".js-search-trigger", function(e) {
theme.mfpOpen("search");
e.preventDefault();
});
//cart popup trigger click
if (theme.cart_ajax) {
$(document).on("click touchend", ".js-cart-trigger", function(e) {
  theme.mfpOpen("cart");
  e.preventDefault();
});
}
//mobile menu drawer trigger click
$(document).on("click touchend", ".js-mobile-draw-trigger", function(e) {
theme.mfpOpen("menu-draw");
e.preventDefault();
});

//mobile menu drawer trigger click
$(document).on("click touchend", ".js-store-availability-draw-trigger", function(e) {
theme.mfpOpen("store-availability-draw");
e.preventDefault();
});

//collection sidebar drawer trigger click
$(document).on("click touchend", ".js-collection-draw-trigger", function(e) {
theme.mfpOpen("collection-draw");
e.preventDefault();
});

//magnific js close link
$(document).on("click touchend", ".js-close-mfp", function(e) {
$.magnificPopup.close();
e.preventDefault();
});

//fixing lazyload image masonry layout
$('.o-layout--masonry').imagesLoaded().always ( function() {
  theme.masonryLayout();
});

//general
//check if recommended products are not present and init cart
//checking to avoid double cart initiation
if (document.querySelector('.js-product-recommendations') === null) {
	theme.runAjaxCart();
}

theme.headerScrollUp();

theme.productRecommendations();
theme.productComplementary();
theme.masonryLayout();
theme.triggerActive();
theme.headerNav();
theme.localizeToggle();
theme.magnificVideo();
theme.ageCheckerCookie();
theme.promoPopCookie();
theme.footerTweet();
theme.scrollToDiv();
theme.animScroll();
theme.productGridImageObserver();
theme.productCollSwatch();
theme.cartCheckbox();
theme.homeEventFeeds();

//homepage
theme.homeMaps();
theme.homeVideoGallery();
theme.homeMainCarousel();
theme.homeFeaturedCollection();
theme.homeFeaturedProduct();
theme.homeSectionMargin();
theme.testimonialsCarousel();
theme.logoCarousel();

//collection
theme.collectionFormSubmit(); 
theme.priceRangeSlider();
theme.quickShopModal();

//product single
theme.productMediaInit();
theme.thumbsCarousel();
theme.accordion();
theme.productZoom();
theme.StoreAvailability();

/*============================================================================
  Money Format
  - Shopify.format money is defined in option_selection.js.
	If that file is not included, it is redefined here.
==============================================================================*/
if (typeof Shopify === "undefined") {
  Shopify = {};
}
if (!Shopify.formatMoney) {
  Shopify.formatMoney = function(cents, format) {
	var value = "",
	  placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
	  formatString = format || this.money_format;

	if (typeof cents == "string") {
	  cents = cents.replace(".", "");
	}

	function defaultOption(opt, def) {
	  return typeof opt == "undefined" ? def : opt;
	}

	function formatWithDelimiters(number, precision, thousands, decimal) {
	  precision = defaultOption(precision, 2);
	  thousands = defaultOption(thousands, ",");
	  decimal = defaultOption(decimal, ".");

	  if (isNaN(number) || number === null) {
		return 0;
	  }

	  number = (number / 100.0).toFixed(precision);

	  var parts = number.split("."),
		dollars = parts[0].replace(
		  /(\d)(?=(\d\d\d)+(?!\d))/g,
		  "$1" + thousands
		),
		cents = parts[1] ? decimal + parts[1] : "";

	  return dollars + cents;
	}

	switch (formatString.match(placeholderRegex)[1]) {
	  case "amount":
		value = formatWithDelimiters(cents, 2);
		break;
	  case "amount_no_decimals":
		value = formatWithDelimiters(cents, 0);
		break;
	  case "amount_with_comma_separator":
		value = formatWithDelimiters(cents, 2, ".", ",");
		break;
	  case "amount_no_decimals_with_comma_separator":
		value = formatWithDelimiters(cents, 0, ".", ",");
		break;
	}

	return formatString.replace(placeholderRegex, value);
  };
}