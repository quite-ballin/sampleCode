/*
This handles client side socket.io connection and communication with a Node.js server, to allow a user to sign into
a leaderboard server using query strings based on where a user is sitting in a stadium (see lines 26-29)

fires at the begininning of the app
*/
var ClientConnection = pc.createScript('clientConnection');
ClientConnection.attributes.add('shouldConnect', { type: 'boolean' , default: true});
ClientConnection.attributes.add('connectionURL', { type: 'string' });
ClientConnection.attributes.add('connectionUpdateTick', { type: 'number' , default: 4});
ClientConnection.attributes.add('toLeaderboardGrp', { type: 'entity'});

// initialize code called once per entity
ClientConnection.prototype.initialize = function() {
    var self = this;
    
    //connecting via socket to the server
    if(!this.shouldConnect){
        console.log("not connecting to server");
        this.toLeaderboardGrp.enabled = false;
        this.entity.script.destroy('clientConnection');
    }
    else{
        this.socket = io.connect(this.connectionURL);  

        this.seat = this.getURLParameter("seat").toString();
        this.section = this.getURLParameter("section").toString();
        this.row = this.getURLParameter("row").toString();
        this.eventID = this.getURLParameter("event").toString();
        //starts as a negative number to recieve the first connection tick 
        //this is held on the server, but the client needs to know it for UI reasons later
        this.leaderboardUpperLimit = -1;
        //this player's high score and seat number and eventID. should be retrieving it from url
        this.highScore = 0;
        //  Query string values coming in
        //making sure query string is valid
        if(this.eventID === undefined){
            console.log("did not sign into event");
        }
        if((this.section === undefined) || (this.row === undefined) || (this.seat === undefined)){
            console.log("did not sign into unique seat");
        }
        console.log("event:" + this.eventID);
        console.log("section: ", + this.section + ", row: ", + this.row + ", seat: " + this.seat);
        //local leaderboard
        this.leaderboardList = [];
        
        //ticking variables for the update tick
        this.shouldBeTicking = false;
        this.tickCounter = 0;
        

        //whenever the socket connects.
        this.socket.on("connect", function(){
            self.app.fire("connectionSuccesful");
            console.log("server responded. you've connected");
        },this);
        //server will update the leaderboard's max length on a connection. 
        this.socket.on("updateLeaderboardUpperLimit", function(upperLimit){
            console.log("upper limit of leaderboard is this: " + upperLimit.toString());
            if(self.leaderboardUpperLimit <= 0){
                self.leaderboardUpperLimit = upperLimit;
            }
            //initializes the leaderboard manager and its accompanying UI
            self.app.fire("initializeLocalLeaderboard", upperLimit);
            self.socket.emit('updateTick', self.eventID);
        },this);
        //score submission is successful. this is a response to the submit score 
        //event that is conditionally sent on death
        this.socket.on("submissionSuccessful", function(){
            self.app.fire("submissionSuccessful");
        },this);

        //edge case of if dynamoDB fails... still will show up in game as a succesful submission because this should 
        //bassically never happen
        this.socket.on('dynamoFailedtoPut',function(){
            console.log("FAILED TO PUT INTO DATABASE");
        },this);
        
        //gets leaderboard from the server
        //catches if the playerlist is undefined. only updates client side list if its defined.
        //sends the list regardless of if its defined to the leaderboard ui which handles it whether
        //its defined or not.
        this.socket.on('getUpdatedScores', function(playerList){
            console.log(playerList);
            if(playerList != undefined){
                self.leaderboardList = playerList;
            }
            //console.log(playerList);
            self.app.fire('updateLocalLeaderboard', playerList);
        },this);
        
        //retreiving seat number and high score from the game on this events
        //submits to server if it should go onto the board.
        //does not submit if it isnt a new high score
        //sends dummy submission if the player resets but is already in the leaderboard higher from another game instance
        //sends dummy submission if the player got a new high score but isnt high enough to get onto the leaderboard
        this.app.on('submitScore',function(individualScore, highScore){    
            self.highScore = highScore;
            //if they didnt get a new high score it doesnt need to submit
            if((Math.floor(individualScore) < Math.floor(highScore)) || (highScore < 1)){
                console.log("not submitting because not a new high score or high score is less than 1");
                this.dontSubmitScore();
            }
            else{
                //if the board has open slots and its not already on the board with a higher score
                if((self.leaderboardList.length < self.leaderboardUpperLimit) && (!self.isOnLeaderboardHigher())){
                    console.log("submitting because the leaderboard isnt full and this isn't in there with a higher value");
                    this.submitScore();
                }
                //if its higher than the bottom slot
                else if((self.leaderboardList[self.leaderboardList.length - 1].highScore < Math.floor(self.highScore)) &&(!self.isOnLeaderboardHigher())){
                    console.log("submitting even though the leaderboard is full because its higher than the last slot and it isnt in there with a higher value");
                    this.submitScore();
                }
                //if the board is full and its not higher than the bottom slot
                else{
                    console.log("board was full or it wasn't high enough to overtake the bottom slot");
                    this.dontSubmitScore();
                }
            }
        },this);
        
        //makes it only tick when the leaderboard UI is on the screen
        this.app.on('leaderboardOnScreen',function(){
            self.shouldBeTicking = true;
            self.socket.emit('updateTick', this.eventID);
            self.tickCounter = 0;
        },this);

        this.app.on("leaderboardOffScreen", function(){
            self.shouldBeTicking = false;
        },this);
    }
    
};

//update function. only for keeping the leaderboard updated
ClientConnection.prototype.update = function(dt) {
    if(this.tickCounter >= this.connectionUpdateTick){
        if(this.socket.connected){
            this.tickCounter = 0;
            this.socket.emit('updateTick', this.eventID);
        }
    }
    if(this.shouldBeTicking){
        this.tickCounter += dt;
    }
};

//retrieves query strings
ClientConnection.prototype.getURLParameter = function(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
};

ClientConnection.prototype.isOnLeaderboardHigher = function() {
    for (let i = 0; i < this.leaderboardList.length; i++) {
        if ((this.leaderboardList[i].section === this.section) && (this.leaderboardList[i].row === this.row) && (this.leaderboardList[i].seat === this.seat)) {
            if(this.leaderboardList[i].highScore >= this.highScore){
                return true;
            }
        }
    }
    return false;
};

ClientConnection.prototype.submitScore = function() {
    this.socket.emit ('submitScore', Math.floor(this.highScore), this.section, this.row, this.seat, this.eventID);  
};

ClientConnection.prototype.dontSubmitScore = function() {
    console.log("didntSubmit");
};