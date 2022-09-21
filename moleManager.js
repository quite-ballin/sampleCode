/*
This manager talks to all the moles that are controlled by their own mole controller. It sends
them in waves and varies their lifespan, and behaivor based on different types.
*/

var MoleManager = pc.createScript('moleManager');
MoleManager.attributes.add('timeAboveGround', { type: "number",
    description: "base time moles should spend above ground", default:4});
MoleManager.attributes.add('groundTimeVariance', { type: "number",
    description: "variance in time the moles should spend above ground", default: 0});
MoleManager.attributes.add('timeInBetweenWaves', { type: "number",
    description: "time between mole spawn", default: 1});
MoleManager.attributes.add('waveTimeVariance', { type: "number",
    description: "variance in time between spawns", default: .5});
MoleManager.attributes.add('baseMolePointValue', { type: "number",
    description: "", default: 120});
MoleManager.attributes.add('goldMolePointValue', { type: "number",
    description: "", default: 350});
MoleManager.attributes.add('bombMolePointValue', { type: "number",
    description: "", default: 20});

//
MoleManager.prototype.initialize = function() {
    //initial setup variables. gets all moles in game by a tag
    this.gameInProgress = false;
    this.moles = this.app.root.findByTag("mole");

    //corresponding functions from app bus commands
    this.app.on("moleContact", this.hitMole, this);
    this.app.on("resetMoles", this.resetMoles, this);
    this.app.on("startGame", function(){
        this.gameInProgress = true;
    }, this);
    this.app.on("stopGame", function(){
        this.gameInProgress = false;
    }, this);

    //coming from a mole controler, talking on the manager's bus. 
    this.entity.on("sucessfulHit", function(type){
        if(type === "Base"){
            this.app.fire("addPoints", this.baseMolePointValue);
        }
        else if(type === "Gold"){
            this.app.fire("addPoints", this.goldMolePointValue);
        }
        else if(type === "Bomb"){
            this.app.fire("addPoints", this.bombMolePointValue);
        }
    },this);

    //sets random time to next wave.
    this.resetTimeToNextWave();

    //types of moles
    this.moleTypes = ["Base", "Gold", "Bomb"];
};

//on hit, fires a hit event on that specific mole's event bus
MoleManager.prototype.hitMole = function(moleThatWasHit){    
    for(let i = 0; i < this.moles.length; i++){
        if(moleThatWasHit === this.moles[i]){
            this.moles[i].fire("hit");
        }
    }
};
//counts time and spawns moles according to the wave timer
MoleManager.prototype.update = function(dt) {
    this.timeToNextWave -= dt;

    if(this.timeToNextWave <= 0){
        this.spawnMole();
        this.resetTimeToNextWave();
    }
};

//spawns moles
MoleManager.prototype.spawnMole = function(){
    //randomly chooses a mole entity to spawn, the moles lifespan within the threshold, and the mole type
    let moleEntity = this.moles[this.getRandomInt(0,this.moles.length)];
    let moleLifeSpan = this.timeAboveGround + this.getRandomFloat(-this.groundTimeVariance, this.groundTimeVariance);
    let moleType = this.moleTypes[this.getRandomInt(0,this.moleTypes.length)];
    //when game isnt in play, the type is always base
    if(!this.gameInProgress){
        moleType = this.moleTypes[0];
    }

    //spawn mole with location, how long to stay above ground, mole type as long as the mole slot isnt take
    if(!moleEntity.script.moleController.getIsSpawned()){
        moleEntity.fire("spawnMole", moleLifeSpan, moleType);
    }
    //if it is taken, try again. after this if its still taken just give up.
    else{
        //roll dice again for a different mole entity
        moleEntity = this.moles[this.getRandomInt(0,this.moles.length)];
        if(!moleEntity.script.moleController.getIsSpawned()){
            moleEntity.fire("spawnMole", moleLifeSpan, moleType);
        }
    }
};

//despawns all moles
MoleManager.prototype.resetMoles = function(){    
    for(let i = 0; i < this.moles.length; i++){
        this.moles[i].fire("despawn");
    }
};

//resets the timer for a new mole spawn
MoleManager.prototype.resetTimeToNextWave = function(){
    this.timeToNextWave = this.timeInBetweenWaves + this.getRandomFloat(-this.waveTimeVariance, this.waveTimeVariance);
};

// HELPER FUNCTIONS
//random float, >= min, < max
MoleManager.prototype.getRandomFloat = function(min, max) {
  return Math.random() * (max - min) + min;
};
// get random int, max exclusive, min inclusive
MoleManager.prototype.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
};