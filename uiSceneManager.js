/*
Generic scene manager for UI. UI entities are defined in editor via the attributes above
off is defined as 0 opacity, translated off screen, with disabled buttons
on is 1 opacity, translated on screen to 0,0, with enabled buttons
*/

var UiSceneManager = pc.createScript('uiSceneManager');
UiSceneManager.attributes.add('startScene', { type: 'entity' });
UiSceneManager.attributes.add('instructionsScene', { type: 'entity' });
UiSceneManager.attributes.add('inGameScene', { type: 'entity' });
UiSceneManager.attributes.add('endScene', { type: 'entity' });
UiSceneManager.attributes.add('leaderboardScene', { type: 'entity' });
UiSceneManager.attributes.add('leadGenScene', { type: 'entity' });
UiSceneManager.attributes.add('endBGScene', { type: 'entity' });
UiSceneManager.attributes.add('endBGElement', { type: 'entity' });
UiSceneManager.attributes.add('transitionSpeed', { type: 'number' });

UiSceneManager.prototype.initialize = function() {    
    let self = this;
    //access scenes
    this.scenes = [this.startScene, this.instructionsScene, this.endScene, this.inGameScene, this.leaderboardScene];
    this.currentScene = this.startScene;

    //bg panning animation variables
    this.endPanRect = new pc.Vec4(0,0,20,29);

    //explicitly turn all scenes but current scene off
    this.scenes.forEach(function(i){
        if(this.currentScene != i){
            self.switchSceneState(i, "off");
        }
    });
    this.handleOpacityAndButtons(this.currentScene, "on");


    this.opacityTween = undefined;
    //whenever the app manager tells it to changes scenes, it does by passing the scene name in
    //possible names are "start", "game", and "end"
    this.app.on("changeScene", function(sceneNameString){
        self.changeScene(sceneNameString);
    }, this);
};

UiSceneManager.prototype.changeScene = function(sceneNameString) {
    this.handleOpacityAndButtons(this.currentScene, "off");
    //turns current scene off
    //this if block handles end background
    if((this.currentScene === this.inGameScene) && ((sceneNameString === "end") || (sceneNameString === "leadGen"))){
        this.handleOpacityAndButtons(this.endBGScene, "on");

    }
    else if((this.currentScene === this.endScene) && (sceneNameString === "game")){
        this.handleOpacityAndButtons(this.endBGScene, "off");
    }
    //this handles the rest of the scenes
    if(sceneNameString === "start"){
        this.handleOpacityAndButtons(this.startScene, "on");
        this.currentScene = this.startScene;
    }
    if(sceneNameString === "instructions"){
        this.handleOpacityAndButtons(this.instructionsScene, "on");
        this.currentScene = this.instructionsScene;
    }
    else if(sceneNameString === "game"){
        this.handleOpacityAndButtons(this.inGameScene, "on");
        this.currentScene = this.inGameScene;
    }
    else if(sceneNameString === "end"){
        this.handleOpacityAndButtons(this.endScene, "on");
        this.currentScene = this.endScene;
    }
    else if(sceneNameString === "leaderboard"){
        this.handleOpacityAndButtons(this.leaderboardScene, "on");
        this.currentScene = this.leaderboardScene;
    }
    else if(sceneNameString === "leadGen"){
        this.handleOpacityAndButtons(this.leadGenScene, "on");
        this.currentScene = this.leadGenScene;
    }
};

//tween opacity with the scene and whether or not it should go on or off
UiSceneManager.prototype.handleOpacityAndButtons = function(whatToTween, onOrOff) {
    let elementList = whatToTween.findComponents("element");
    let self = this;
    let opacityObject = {value: elementList[0].opacity};
    let targetValue = 1;
    if(onOrOff === "off"){
        targetValue = 0;
        this.switchButtons(whatToTween, "off");
    }
    else if(onOrOff === "on"){
        elementList.forEach(function(i){
            if(i.mask != true){
                i.opacity = 0;
            }
        });
        whatToTween.setPosition(0,0,0);
    }
    this.opacityTween = whatToTween.tween(opacityObject)
        .to({value: targetValue}, this.transitionSpeed, pc.QuadraticInOut)
        .delay(0)
        .on('update', function(){
            elementList.forEach(function(i){
                    if(i.mask != true){
                        i.opacity = opacityObject.value;
                    }
                    //i.opacity = opacityObject.value;
            });
        })
        .on('complete', function(){
                if(onOrOff === "off"){
                    whatToTween.setPosition(-1000,0,0);
                }
                else{
                    //if its goin on, turn the button on
                    self.switchButtons(whatToTween, "on");
                }
        })                             
        .start();
};

//immediately set opacity and button active states
UiSceneManager.prototype.switchSceneState = function(whatToSwitch, onOrOff){
    this.switchOpacity(whatToSwitch, onOrOff);
    this.switchButtons(whatToSwitch, onOrOff);
};
//explicity set opacity of a scene
UiSceneManager.prototype.switchOpacity = function(whatToSwitch, onOrOff) {
    let targetValue = 1;
    if(onOrOff === "off"){
        targetValue = 0;
    }
    let elementList = whatToSwitch.findComponents("button");
    elementList.forEach(function(i){
        if(i.mask != true){
            i.opacity = targetValue;
        }
    });
};
//explicity set button active state
UiSceneManager.prototype.switchButtons = function(whatToSwitch, onOrOff) {
    let targetState = true;
    if(onOrOff === "off"){
        targetState = false;
    }

    let buttonComponents = whatToSwitch.findComponents("button");
    buttonComponents.forEach(function(i){
        i.active = targetState;
    });
};


