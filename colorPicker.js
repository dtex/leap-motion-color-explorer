var colorPicker = {
  
  // Some default values, most of which are replaced once we initialize
  color: { hue: 0, saturation: 50, lightness: 50, complements: 128, angle: 180 },
  compCount: 0,
  pointables: 0,
  pointablesDuration: 0,
  wheelRadius: 90,
  
  // Cache our elements so we don't have to look them up every refresh
  el: {
    results: document.getElementsByClassName('results')[0],
    views: document.getElementsByClassName('color-viewer'),  
    primary: {
      view: document.getElementsByClassName('primary')[0],
      marker: document.getElementsByClassName('ci-primary')[0]
    },
    first: {
      view: document.getElementsByClassName('first')[0],
      marker: document.getElementsByClassName('ci-first')[0]
    },
    second: {
      view: document.getElementsByClassName('second')[0],
      marker: document.getElementsByClassName('ci-second')[0]
    },
    third: {
      view: document.getElementsByClassName('third')[0],
      marker: document.getElementsByClassName('ci-third')[0]
    }
  },
  
  // These define our valid compliment states for each mode
  compProfiles: [
    { minAngle: 180, maxAngle: 180 },
    { minAngle: 180, maxAngle: 180 },
    { minAngle: 5, maxAngleDelta: 85 },
    { minAngle: -90, maxAngleDelta: 180 } 
  ],
  
  // Create the controller
  controller: new Leap.Controller({enableGestures: true}),

  // Adjust the sizes (heights) of all our elements
  // I'd really like to redo this with Flexbox when I know it better.
  // Todo: when aspect ratio < 1:1 the instructions don't resize properly
  fixSizes: function() {
  
    var nodes = document.getElementsByClassName('tall');
    
    var height = window.innerHeight|| window.document.documentElement.clientHeight|| document.getElementsByTagName('body')[0].clientHeight;
    
    // Make all the tall divs go full height
    for (i = 0, j = nodes.length; i<j; i++ ) {
      nodes[i].style.height = height+'px'; 
    }
    
    var nodes = document.getElementsByClassName('tint');
    for (i = 0, j = nodes.length; i<j; i++ ) {
      nodes[i].style.height = (height * .2)+'px'; 
    }
    
    var nodes = document.getElementsByClassName('darker');
    var marginTop = height * .6;
    for (i = 0, j = nodes.length; i<j; i++ ) {
      nodes[i].style.marginTop = marginTop+'px'; 
    }
    
    var nodes = document.getElementsByClassName('darkest');
    for (i = 0, j = nodes.length; i<j; i++ ) {
      nodes[i].style.marginTop = marginTop+'px'; 
    }
    
    iHeight = (height - 80)/8;
    var nodes = document.getElementsByClassName('inst');
    for (i = 0, j = nodes.length; i<j; i++ ) {
      nodes[i].style.height = iHeight +'px';
      nodes[i].style.width = iHeight+'px'; 
      nodes[i].style.backgroundPosition = 'center ' + String(iHeight * -i + 10) + 'px';
    }
    
    var logo = document.getElementsByClassName('logo')[0];
    logo.style.height = logo.clientWidth + 'px';
    this.wheelRadius = (logo.clientWidth - 16)/2;
  },
  
  // Count the fingers being displayed and update the display
  updateFingerState: function(hand) {
  
     // Make an array that only has pointables whose length > 20mm
    var tPointables = [];
    for (i = 0, j = hand.pointables.length; i<j; i++ ) {
      if (hand.pointables[i].length > 20)
        tPointables.push(hand.pointables[i]);
    }
    
    var fingers = tPointables.length
      
    if (fingers === 5) {
       this.pointables = fingers;
       this.updateColors();
    }
    
    if (fingers !== this.pointables) {
      this.pointables = fingers;
      this.pointablesDuration = new Date();
    }
    
    // If we are showing fewer than 5 fingers for more than 2000ms and it changes the current state then
    if (fingers != 0 && fingers != 5 && fingers != this.compCount && fingers === this.pointables && new Date() - this.pointablesDuration > 500) {
      
      ['primary', 'first', 'second', 'third'].forEach(function(name, index) {
        if (index + 1 <= fingers) {
          this.el[name].marker.style.display = 'block';
        } else {
          this.el[name].marker.style.display = 'none';
        }
      }, this);
      
      this.compCount = fingers;
      
      this.setClasses([null, 'mono','compliment','triad','tetrad'][fingers]);
      this.updateColors();
      renderComplements();
      
    }
    
    if (fingers === 0) {
       var t = '<p>Primary: ' + this.colorToHex(this.el.primary.view.style.backgroundColor.toString()) + ';<br/>';
       if (this.compCount > 1) {
        t += 'Complement 1: ' + this.colorToHex(this.el.first.view.style.backgroundColor.toString()) + ';<br/>';
       }
       if (this.compCount > 2) {
        t += 'Complement 2: ' + this.colorToHex(this.el.second.view.style.backgroundColor.toString()) + ';<br/>';
       }
       if (this.compCount > 3) {
        t += 'Complement 3: ' + this.colorToHex(this.el.third.view.style.backgroundColor.toString()) + ';<br/>';
       }
       t+='</p>'
       this.el.results.innerHTML = t;
    }
  
  },
  
  // Update the primary color
  updateColors: function() {  
    var t = 'hsl('+this.color.hue+','+this.color.saturation+'%,'+this.color.lightness+'%)';
    this.el.primary.view.style.background  = (t);
    this.updateTints(this.el.primary.view, this.color.hue, this.color.saturation, this.color.lightness);
    this.updateMarker(this.el.primary.marker, this.color.hue);
    renderComplements();
  },
  
  // Update the tints in a single column
  updateTints: function(el, hue, saturation) {
    var tints = el.getElementsByClassName('tint');
    ['80%', '65%', '35%', '20%'].forEach(function(val, index) {
      tints[index].style.background = ('hsl('+hue+','+saturation+'%,'+val+')');
    });
  },

  // Update marker positions
  updateMarker: function(el, angle) {
    var rads = (angle + 180) * -0.0174532925
    var length = this.wheelRadius * this.color.saturation / 100;
    var x = Math.sin(rads) * length + this.wheelRadius + 8;
    var y = Math.cos(rads) * length + this.wheelRadius + 8;
    el.style.marginLeft = x + 'px';
    el.style.marginTop = y + 'px';
    el.style.display = 'block';
  },
  
  // put rendercompliments here when it is ready
  
  // Update the views with the current mode class name
  setClasses: function(targetClass) {
    ['mono', 'compliment', 'triad', 'tetrad'].forEach(function(mode, index) {
      for (var i = 0, j = colorPicker.el.views.length; i<j; i++ ) {
        this.el.views[i].classList.add(targetClass);
        if (mode !== targetClass) {
          colorPicker.el.views[i].classList.remove(mode);
        }
      }
    }, this);
  },
  
  //Convert an RGB color to hex
  colorToHex: function (color) {
      if (color.substr(0, 1) === '#') {
          return color;
      }
      var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
  
      var red = parseInt(digits[2]);
      var green = parseInt(digits[3]);
      var blue = parseInt(digits[4]);
  
      var rgb = blue | (green << 8) | (red << 16);
      return digits[1] + '#' + rgb.toString(16);
  },
  
  //Initial setup and event listeners
  initialize: function() {
    this.fixSizes();
    self = this;
    
    this.controller.on('frame', function(frame){ 
      
      if (frame.hands.length === 0 || frame.hands[0].palmPosition[1] < 150) return;
      
      var hand = frame.hands[0];
      
      // Update our hue based on the hands x position
      var hue = 180 + 360/300 * (hand.palmPosition[0] + 150);
      if (hue < 0) hue += 720;
      if (hue > 360) hue = hue % 360;  
      self.color.hue = hue;
      
      // Update our saturation based on the hand's y position
      var saturation = 100/150 * (hand.palmPosition[1] - 150);
      if (saturation < 0) saturation = 0;
      if (saturation > 100) saturation = 100;
      self.color.saturation = saturation;
      
      // update our angle based on the hand's z position
      var angle = (hand.palmPosition[2] + 50) / 100;
      if (angle < 0) angle = 0;
      if (angle > 1) angle = 1; 
      self.color.angle = angle;
      
      self.updateFingerState(hand);
         
    });
    
    window.addEventListener('resize', function(event){
      location.reload();
      return;
    });
    
    this.controller.connect();
    
    this.updateColors();
  }
   
}


/*****
   I'm leaving this function in the global namespace 
   because it sucks and I need to redo it. I must have 
   been drunk when I wrote it the first time
*****/
var renderComplements = function() {
  
  var myCompliment = (colorPicker.color.hue + 180) % 360;
  
  if (colorPicker.compCount === 2) {
    
    var t = 'hsl('+myCompliment+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.first.view.style.background  = (t);
    colorPicker.updateMarker(colorPicker.el.first.marker, myCompliment);
    colorPicker.updateTints(colorPicker.el.first.view, myCompliment, colorPicker.color.saturation, colorPicker.color.lightness);
  
  }
  
  if (colorPicker.compCount === 3) {
    
    var comp1 = myCompliment + (colorPicker.color.angle * colorPicker.compProfiles[2].maxAngleDelta + colorPicker.compProfiles[2].minAngle) % 360,
      comp2 = myCompliment - (colorPicker.color.angle * colorPicker.compProfiles[2].maxAngleDelta + colorPicker.compProfiles[2].minAngle) % 360;
    
    var t = 'hsl('+comp1+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.first.view.style.background  = (t);
    
    t = 'hsl('+comp2+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.second.view.style.background  = (t);
    
    colorPicker.updateMarker(colorPicker.el.first.marker, comp1);
    colorPicker.updateMarker(colorPicker.el.second.marker, comp2);
    colorPicker.updateTints(colorPicker.el.first.view, comp1, colorPicker.color.saturation, colorPicker.color.lightness);
    colorPicker.updateTints(colorPicker.el.second.view, comp2, colorPicker.color.saturation, colorPicker.color.lightness);
  
  }
  
  if (colorPicker.compCount === 4) {
    
    var comp1 = myCompliment + (colorPicker.color.angle * colorPicker.compProfiles[3].maxAngleDelta + colorPicker.compProfiles[3].minAngle) % 360,
      comp2 = colorPicker.color.hue - (colorPicker.color.angle * colorPicker.compProfiles[3].maxAngleDelta + colorPicker.compProfiles[3].minAngle) % 360;
    
    var t = 'hsl('+comp1+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.first.view.style.background  = (t);
    
    t = 'hsl('+myCompliment+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.second.view.style.background  = (t);
    
    t = 'hsl('+comp2+','+colorPicker.color.saturation+'%,'+colorPicker.color.lightness+'%)';
    colorPicker.el.third.view.style.background  = (t);
    
    colorPicker.updateMarker(colorPicker.el.first.marker, comp1);
    colorPicker.updateMarker(colorPicker.el.second.marker, myCompliment);
    colorPicker.updateMarker(colorPicker.el.third.marker, comp2);
    
    colorPicker.updateTints(colorPicker.el.first.view, comp1, colorPicker.color.saturation, colorPicker.color.lightness);
    colorPicker.updateTints(colorPicker.el.second.view, myCompliment, colorPicker.color.saturation, colorPicker.color.lightness);
    colorPicker.updateTints(colorPicker.el.third.view, comp2, colorPicker.color.saturation, colorPicker.color.lightness);
  
  }
  
}

colorPicker.initialize();

  




