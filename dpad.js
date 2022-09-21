/*
The manager for the dpad. This UI element reads input and allows the user to pivot around the screen like they would
with a physical joystick or dpad. 

This can be easily repurposed into a true 360 degree joystick by not clamping the values in the handleDpadDirectionPress 
function and instead just outputting the degree value. The mapping is shown below:

    AXIS LABELS
      -
    -   +
      +

    ANGLE LABELS
     180-270  | 270-360
        -------------
      90-180  | 90-0

*/
var Dpad = pc.createScript('dpad');
Dpad.attributes.add('dpad', {type: 'entity' });
Dpad.attributes.add('dpadDeadZone', { type: "number",
    description: "increases width of hitbox", default:20});
Dpad.attributes.add('dpadMaxDistance', { type: "number",
    description: "increases width of hitbox", default:300});

Dpad.prototype.initialize = function() {
    let self = this;

    //variables for dpad
    this.touchCoords = {
        x: 0,
        y: 0
    };
    this.lastDpadDirection = undefined;
    this.currentDpadDirection = undefined;
    this.dpadOriginCoords = undefined;
    this.dpadPressed = false;

    //get touch start
    this.dpad.button.on('touchstart', function(event){
        self.resetDpadCoords();
        self.dpadPressed = true;
        self.touchCoords.x = event.x;
        self.touchCoords.y = event.y;
        this.handleDpadDirectionPress();
    },this);
    //whenever it moves, handle the direction press
    this.dpad.element.on('touchmove', function(event){
        self.touchCoords.x = event.x;
        self.touchCoords.y = event.y;
        if(self.hasLeftDpad()){
            if(self.currentDpadDirection != "undefined"){
                self.app.fire("movementButtonRelease", this.currentDpadDirection);
            }
            this.clearDpad();
            self.dpadPressed = false;
        }
        if(self.dpadPressed){
            self.handleDpadDirectionPress();
        }
    },this);
    //when touch ends or is cancelled, reset all variables 
    this.dpad.element.on('touchend', function(){
        if(self.currentDpadDirection != "undefined"){
            self.app.fire("movementButtonRelease", this.currentDpadDirection);
        }
        this.clearDpad();
        self.dpadPressed = false;
    },this);
    this.dpad.element.on('touchcancel', function(){
        if(self.currentDpadDirection != "undefined"){
            self.app.fire("movementButtonRelease", this.currentDpadDirection);
        }
        self.clearDpad();
        self.dpadPressed = false;
    },this);
};

//returns if thumb has left the dpad space based on the max distance threshold
Dpad.prototype.hasLeftDpad  = function() {
    if(this.distance2D(this.touchCoords.x,this.touchCoords.y, this.dpadOriginCoords.x, this.dpadOriginCoords.y) > this.dpadMaxDistance){
        return true;
    }
    else{
        return false;
    }
};

//handles direction press. clamps between angles so analog movement is now 4 directions. Also makes sure the distance is 
//between dead zone and max distance
Dpad.prototype.handleDpadDirectionPress  = function() {
    let distance = this.distance2D(this.touchCoords.x,this.touchCoords.y, this.dpadOriginCoords.x, this.dpadOriginCoords.y);
    if((distance > this.dpadDeadZone) && (distance < this.dpadMaxDistance)){
        let angle = this.angleBetweenPts2D(this.touchCoords.x,this.touchCoords.y, this.dpadOriginCoords.x, this.dpadOriginCoords.y);
        if(((angle >= 0) && (angle < 45)) || ((angle >= 315) && (angle <= 360))){
            if(this.currentDpadDirection != "right"){
                if(this.lastDpadDirection != "undefined"){
                    this.app.fire("movementButtonRelease", this.lastDpadDirection);
                }
                this.lastDpadDirection = this.currentDpadDirection;
                this.currentDpadDirection = "right";
                this.app.fire("movementButtonPress", "right");
            }
        }
        else if((angle < 135) && (angle >= 45)){
            if(this.currentDpadDirection != "down"){
                if(this.lastDpadDirection != "undefined"){
                    this.app.fire("movementButtonRelease", this.lastDpadDirection);
                }
                this.lastDpadDirection = this.currentDpadDirection;
                this.currentDpadDirection = "down";
                this.app.fire("movementButtonPress", "down");
            }        
        }
        else if((angle < 225) && (angle >= 135)){
            if(this.currentDpadDirection != "left"){
                if(this.lastDpadDirection != "undefined"){
                    this.app.fire("movementButtonRelease", this.lastDpadDirection);
                }
                this.lastDpadDirection = this.currentDpadDirection;
                this.currentDpadDirection = "left";
                this.app.fire("movementButtonPress", "left");
            }        
        }
        else if((angle < 315) && (angle >= 225)){
            if(this.currentDpadDirection != "up"){
                if(this.lastDpadDirection != "undefined"){
                    this.app.fire("movementButtonRelease", this.lastDpadDirection);
                }
                this.lastDpadDirection = this.currentDpadDirection;
                this.currentDpadDirection = "up";
                this.app.fire("movementButtonPress", "up");
            }        
        }
    }
    else{
        this.app.fire("movementButtonRelease", this.lastDpadDirection);
        this.clearDpad();
    }
};

//clear dpad inputs
Dpad.prototype.clearDpad  = function() {
    this.lastDpadDirection = undefined;
    this.currentDpadDirection = undefined;
    this.app.fire("setDpadSpriteToNeutral");
};
//reset dpad coordinates
Dpad.prototype.resetDpadCoords = function() {
    this.dpadOriginCoords = {
        x: (this.dpad.element.canvasCorners[1].x + this.dpad.element.canvasCorners[0].x) / 2,
        y: (this.dpad.element.canvasCorners[1].y + this.dpad.element.canvasCorners[2].y) / 2
    };
};

//HELPER FUNCTIONS
Dpad.prototype.distance2D = function(x1, y1, x2, y2) {
    let x = x2 - x1;
    let y = y2 - y1;
    return Math.sqrt((x * x) + (y * y));
};
Dpad.prototype.angleBetweenPts2D = function(x1, y1, x2, y2) {
    let x = x2 - x1;
    let y = y2 - y1;
    return (Math.atan2(y, x) * 180) / (Math.PI) + 180;
};