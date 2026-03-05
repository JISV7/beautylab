# Install from NPM
We can install Swiper from NPM

`pnpm install swiper`
```
// import Swiper JS
import Swiper from 'swiper';
// import Swiper styles
import 'swiper/css';

const swiper = new Swiper(...);
```

By default Swiper exports only core version without additional modules (like Navigation, Pagination, etc.). So you need to import and configure them too:
```
// core version + navigation, pagination modules:
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// init Swiper:
const swiper = new Swiper('.swiper', {
  // configure Swiper to use modules
  modules: [Navigation, Pagination],
  ...
});
```
If you want to import Swiper with all modules (bundle) then it should be imported from swiper/bundle:
```
// import Swiper bundle with all modules installed
import Swiper from 'swiper/bundle';

// import styles bundle
import 'swiper/css/bundle';

// init Swiper:
const swiper = new Swiper(...);
```

# Styles
Swiper package contains different sets of CSS styles:

CSS styles for bundle version:

swiper-bundle.css - all Swiper styles including all modules styles (like Navigation, Pagination, etc.)
swiper-bundle.min.css - same as previous but minified
CSS styles for bundle version (package imports):

swiper/css - all Swiper styles including all modules styles (like Navigation, Pagination, etc.)
swiper/css/bundle - same as previous but minified
CSS styles for core version and modules (package imports):

swiper/css - only core Swiper styles
swiper/css/a11y - styles required for A11y module
swiper/css/autoplay - styles required for Autoplay module
swiper/css/controller - styles required for Controller module
swiper/css/effect-cards - styles required for Cards Effect module
swiper/css/effect-coverflow - styles required for Coverflow Effect module
swiper/css/effect-creative - styles required for Creative Effect module
swiper/css/effect-cube - styles required for Cube Effect module
swiper/css/effect-fade - styles required for Fade Effect module
swiper/css/effect-flip - styles required for Flip Effect module
swiper/css/free-mode - styles required for Free Mode module
swiper/css/grid - styles required for Grid module
swiper/css/hash-navigation - styles required for Hash Navigation module
swiper/css/history - styles required for History module
swiper/css/keyboard - styles required for Keyboard module
swiper/css/manipulation - styles required for Manipulation module
swiper/css/mousewheel - styles required for Mousewheel module
swiper/css/navigation - styles required for Navigation module
swiper/css/pagination - styles required for Pagination module
swiper/css/parallax - styles required for Parallax module
swiper/css/scrollbar - styles required for Scrollbar module
swiper/css/thumbs - styles required for Thumbs module
swiper/css/virtual - styles required for Virtual module
swiper/css/zoom - styles required for Zoom module

# Pagination Parameters
Name	Type	Default	Description
pagination	boolean | PaginationOptions		
Object with pagination parameters or boolean true to enable with default settings.

const swiper = new Swiper('.swiper', {
  pagination: {
    el: '.swiper-pagination',
    type: 'bullets',
  },
});
{
bulletActiveClass	string	'swiper-pagination-bullet-active'	
CSS class name of currently active pagination bullet

bulletClass	string	'swiper-pagination-bullet'	
CSS class name of single pagination bullet

bulletElement	string	'span'	
Defines which HTML tag will be used to represent single pagination bullet. Only for 'bullets' pagination type.

clickable	boolean	false	
If true then clicking on pagination button will cause transition to appropriate slide. Only for bullets pagination type

clickableClass	string	'swiper-pagination-clickable'	
CSS class name set to pagination when it is clickable

currentClass	string	'swiper-pagination-current'	
CSS class name of the element with currently active index in "fraction" pagination

dynamicBullets	boolean	false	
Good to enable if you use bullets pagination with a lot of slides. So it will keep only few bullets visible at the same time.

dynamicMainBullets	number	1	
The number of main bullets visible when dynamicBullets enabled.

el	HTMLElement | CSSSelector | null	null	
String with CSS selector or HTML element of the container with pagination

enabled	boolean		
Boolean property to use with breakpoints to enable/disable pagination on certain breakpoints

formatFractionCurrent	function(number)		
format fraction pagination current number. Function receives current number, and you need to return formatted value

formatFractionTotal	function(number)		
format fraction pagination total number. Function receives total number, and you need to return formatted value

hiddenClass	string	'swiper-pagination-hidden'	
CSS class name of pagination when it becomes inactive

hideOnClick	boolean	true	
Toggle (hide/show) pagination container visibility after click on Slider's container

horizontalClass	string	'swiper-pagination-horizontal'	
CSS class name set to pagination in horizontal Swiper

lockClass	string	'swiper-pagination-lock'	
CSS class name set to pagination when it is disabled

modifierClass	string	'swiper-pagination-'	
The beginning of the modifier CSS class name that will be added to pagination depending on parameters

paginationDisabledClass	string	'swiper-pagination-disabled'	
CSS class name added on swiper container and pagination element when pagination is disabled by breakpoint

progressbarFillClass	string	'swiper-pagination-progressbar-fill'	
CSS class name of pagination progressbar fill element

progressbarOpposite	boolean	false	
Makes pagination progressbar opposite to Swiper's direction parameter, means vertical progressbar for horizontal swiper direction and horizontal progressbar for vertical swiper direction

progressbarOppositeClass	string	'swiper-pagination-progressbar-opposite'	
CSS class name of pagination progressbar opposite

renderBullet	function(number, string)	null	
This parameter allows totally customize pagination bullets, you need to pass here a function that accepts index number of pagination bullet and required element class name (className). Only for 'bullets' pagination type

const swiper = new Swiper('.swiper', {
  //...
  pagination: {
    //...
    renderBullet: function (index, className) {
      return '<span class="' + className + '">' + (index + 1) + '</span>';
    },
  },
});
renderCustom	function(Swiper, number, number)	null	
This parameter is required for 'custom' pagination type where you have to specify how it should be rendered.

const swiper = new Swiper('.swiper', {
  //...
  pagination: {
    //...
    renderCustom: function (swiper, current, total) {
      return current + ' of ' + total;
    },
  },
});
renderFraction	function(string, string)	null	
This parameter allows to customize "fraction" pagination html. Only for 'fraction' pagination type

const swiper = new Swiper('.swiper', {
  //...
  pagination: {
    //...
    renderFraction: function (currentClass, totalClass) {
      return '<span class="' + currentClass + '"></span>' +
              ' of ' +
              '<span class="' + totalClass + '"></span>';
    },
  },
});
renderProgressbar	function(string)	null	
This parameter allows to customize "progress" pagination. Only for 'progress' pagination type

const swiper = new Swiper('.swiper', {
  //...
  pagination: {
    //...
    renderProgressbar: function (progressbarFillClass) {
      return '<span class="' + progressbarFillClass + '"></span>';
    },
  },
});
totalClass	string	'swiper-pagination-total'	
CSS class name of the element with total number of "snaps" in "fraction" pagination

type	'bullets' | 'fraction' | 'progressbar' | 'custom'	bullets	
String with type of pagination. Can be 'bullets', 'fraction', 'progressbar' or 'custom'

verticalClass	string	'swiper-pagination-vertical'	
CSS class name set to pagination in vertical Swiper

}

# TypeScript Definitions
Swiper is fully typed, it exports Swiper and SwiperOptions types:
```
// main.ts
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';

const swiperParams: SwiperOptions = {
  slidesPerView: 3,
  spaceBetween: 50,
};

const swiper = new Swiper('.swiper', swiperParams);
```