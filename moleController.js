/*
Controls one mole enemy in a Whack-A-Mole game. An entity with this script is spawned by the moleManager. They talk back and forth. 
While the player tries to hit them unless the mole is a bomb type, in which case the player needs to avoid getting caught 
in their explosives.
*/

var MoleController = pc.createScript('moleController');
MoleController.attributes.add('explosionSprite', { type: 'entity' });

// Behavior for one mole. Talked to on the entity bus from the mole manager
MoleController.prototype.initialize = function() {

    //initial setup variables
    this.lifeSpan = 0;
    this.type = "normal";
    this.isUp = false;
    this.isSpawned = false;
    this.isVulnerable = false;
    this.hasBeenHit = false;

    //possible states: downIdle, upIdle, goDown, goUp, hit
    //possible types: Base, Gold, Bomb
    this.animationState = "downIdle";

    //animation flags
    this.isIdleUp = false;
    this.isIdleDown = true;

    //when the mole manager spawns a mole
    this.entity.on("spawnMole", function(lifeSpan, type){
        //randomly flips sprite horizontally
        if(Math.random() < 0.5){
            this.entity.sprite.flipX = true;
        }
        else{
            this.entity.sprite.flipX = false;
        }

        //initializes the mole
        this.isSpawned = true;
        this.lifeSpan = lifeSpan;
        this.type = type;
        this.isUp = true;
        this.isIdleDown = false;
        this.isVulnerable = true;
        this.hasBeenHit = false;
        this.playAnimation("goUp");
    },this);
    //whenever the mole gets hit
    this.entity.on("hit", function(){
        //if it is vulernable, and hasn't already been hit
        if(this.isVulnerable && !this.hasBeenHit){
            this.lifeSpan = 0;
            this.isUp = false;
            this.hasBeenHit = true;
            this.playAnimation("hit");
            this.isIdleUp = false;
            this.entity.parent.parent.fire("sucessfulHit", this.type);
            if(this.type === "Bomb"){
                this.explode();
            }
        }
    },this);


    //despawn function is called when the game is reset
    this.entity.on("despawn", this.despawn, this);
};

//when the the mole controller when it's lifespan reaches 0
MoleController.prototype.goDown = function(){
    this.isUp = false;
    this.isIdleUp = false;
    
    if(this.type === "Bomb"){
        this.explode();
        this.hasBeenHit = true;
        this.playAnimation("hit");
    }
    else{
        this.playAnimation("goDown");
    }
};

//a forced despawn from a game reset
MoleController.prototype.despawn = function(){
    this.isUp = false;
    this.isIdleUp = false;
    this.onDown();
};
//sets variables whenever the mole is completely in the ground, completing its life cycle. 
//its ready to be spawned again after its completely down 
MoleController.prototype.onDown = function(){
    this.isVulnerable = false;
    this.hasBeenHit = false;
    this.isIdleDown = true;
    this.playAnimation("downIdle");
    this.isSpawned = false;
};

//starts idle loop for an active mole
MoleController.prototype.goUpIdle = function(){
    this.isIdleUp = true;
    this.playAnimation("upIdle");
};

//causes explosion 
MoleController.prototype.explode = function(){
    this.explosionSprite.sprite.play("explosion");
    this.explosionSprite.fire("explosion");
};

//plays animation by track name and combines the track name with the type
MoleController.prototype.playAnimation = function(trackName) {
    this.animationState = trackName;
    this.entity.sprite.frame = 0;
    if(trackName === "downIdle"){
        this.entity.sprite.play("downIdleBase");
    }
    else{
        this.entity.sprite.play(trackName + this.type);
    }
};
//called by the manager to see if it is spawned
MoleController.prototype.getIsSpawned = function() {
    return this.isSpawned;
};
// update code called every frame
MoleController.prototype.update = function(dt) {
    //if the mole is up, tick the lifespan down and then tell it to go down once the lifespan is over
    if(this.isUp){
        this.lifeSpan -= dt;
        if(this.lifeSpan <= 0){
            this.goDown();
        }
    }

    //if going up animation track reaches the end, play go up idle
    if(this.animationState === "goUp"){
        if((this.entity.sprite.frame >= 9) && (!this.isIdleUp)){
            this.goUpIdle();
        }
    }

    //if going down reaches the end, reset it with the on down function
    if(this.animationState === "goDown"){
        if( ((this.entity.sprite.frame >= 9) && (!this.isIdleDown)) || (((this.entity.sprite.frame >= 6) && (this.type === "Bomb")) && (!this.isIdleDown))  ){
            this.onDown();
        }
    }
    //if going down off a hit reaches the end, reset it with the on down function
    if(this.animationState === "hit"){
        if((this.entity.sprite.frame >= 6) && (!this.isIdleDown)){
            this.onDown();
        }
    }
};