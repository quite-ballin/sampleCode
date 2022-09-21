/*
This script handles launching a ball from a flick, converting 2D input on a mobile touch screen to 3D movement.
Cannot use a general physics engine on this project, as it adds more weight than the benefits it would provide to this
application.
*/

var BallLaunch = pc.createScript('ballLaunch');

// initialize code called once per entity
BallLaunch.prototype.initialize = function() {
    //reference to the root this for the script. just so there arent scope issues
    var self = this;
    this.launchPos = this.entity.getLocalPosition().clone();
    this.launchRot = this.entity.getLocalEulerAngles().clone();
    this.ballInFlight = false;
    this.flickAngle = 0;
    this.maxFrames = 45;
    this.maxPower = 40;
    
    //when told to launch the football by the screen coordinate flick, executes the launchAttempt function
    this.app.on("successfulFlick", this.launchAttempt, this);
    //when told to reset the football so it can be flicked again
    this.app.on("ballHitGround", this.reset, this);
    
    //setting up tweens for ball kick
    this.horizontalBallLaunchTween = undefined;
    this.rotationalSpeed = 10;

    //whenever the ball hits something reverse rotation and stop forward momentum
    this.app.on("collision", function(){
        self.horizontalBallLaunchTween.stop();
        self.rotationalSpeed = self.rotationalSpeed*-1;
    }, this);
    //update the power of the ball
    this.app.on("updateMaxPower", function(maxPower){
        self.maxPower = maxPower;
    },this);

};

//function for launching football
BallLaunch.prototype.launchAttempt = function(flickDistanceX, flickDistanceY, frameCount) {
    let xComponent = 0;
    let yComponent = 0;
    //first checks to see if the ball is already in the air
    if(this.ballInFlight === false){
        //moves the ball to the starting position
        this.entity.setLocalPosition(this.launchPos);
        this.entity.setEulerAngles(this.launchRot);

        //calculates angle
        //inverse tan of opposite over adjacent and then converted to degrees from radians
        this.flickAngle = Math.atan(flickDistanceY/flickDistanceX);
        this.flickAngle = this.flickAngle * (180/Math.PI);

        //adjust angle to go from right to left, 0 to 180
        //straight left from camera is 0, forward is 90, and straight right is 180
        if(this.flickAngle < 0){
            this.flickAngle = 180 + this.flickAngle;
        }

        //calculate force
        force = this.maxPower * (1 - (frameCount / this.maxFrames));
        
        //use degrees and forward vector to find the x and y components of the vector
        //that will be used to launch the ball
        xComponent = force * Math.cos(this.flickAngle*(Math.PI/180));
        yComponent = force * Math.sin(this.flickAngle*(Math.PI/180));

        // (x, up, y)
        //checks the angle so that the user can not just throw it side ways
        //non physics implementation of the launch
        if (this.flickAngle > 45 && this.flickAngle < 135){
            //this event tells the yTween entity to go up and down and the
            //wind that the ball is being launched so it should apply force based on wind speed
            this.app.fire('launchFootball');
            this.ballInFlight = true;
            var targetPosition = this.entity.getLocalPosition().clone();
            targetPosition.x = targetPosition.x + xComponent;
            targetPosition.z = (targetPosition.z - yComponent);
     
            //tweens the launch
            this.horizontalBallLaunchTween = this.entity.tween(this.entity.getLocalPosition())
                .to(targetPosition, 2, pc.Linear)
                .delay(0)
                .loop(false)
                .yoyo(false);
            // start the tween
            this.horizontalBallLaunchTween.start();
        }
    }
};

//if the ball is in flight, it should be rotating by the rotational speed.
BallLaunch.prototype.update = function(dt) {
    if(this.ballInFlight){
        this.entity.rotate(this.rotationalSpeed*dt,0,0);
    }
};

//function for reseting football to be launched again
BallLaunch.prototype.reset = function(){
    this.horizontalBallLaunchTween.stop();
    this.rotationalSpeed = Math.abs(this.rotationalSpeed);
    this.entity.setLocalPosition(this.launchPos);
    this.entity.setEulerAngles(this.launchRot);
    this.ballInFlight = false;
};
