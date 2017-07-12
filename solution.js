{
    init: function(elevators, floors) {
        for(var id = 0; id < elevators.length; id++) {
            var elevator = elevators[id];
            elevator.id = id;
            elevator.log = function(eventName) {
                if(this.id === 0) {
                    console.log(eventName + "\t floor: " + this.currentFloor() + 
                                ", direction: " + this.getDirection() +
                                "\t\t", this.destinationQueue.toString(), this);
                }
            }
            elevator.getDirection = function(queue = this.destinationQueue) {
                if(queue.length === 0) return "stopped";
                if(this.currentFloor() > queue[0]) return "down";
                if(this.currentFloor() < queue[0]) return "up";
                if(this.currentFloor() === queue[0]) return this.getDirection(queue.slice(1));
            }
            elevator.setIndicators = function() {
                this.goingUpIndicator(["up", "stopped"].includes(this.getDirection()));
                this.goingDownIndicator(["down", "stopped"].includes(this.getDirection()));
            }
            elevator.isFull = function() {
                return this.loadFactor() > 0.7;
            }
            elevator.skipFloor = function(floorNum) {
                var index = this.destinationQueue.indexOf(floorNum);
                if(index != -1) {
                    this.destinationQueue.splice(index, 1);
                }
                this.checkDestinationQueue();
            }
            elevator.goTo = function(floorNum) {
                if(floorNum === this.currentFloor() && this.isFull()) return;
                this.destinationQueue.push(floorNum);
                var self = this;
                this.destinationQueue = [... new Set(this.destinationQueue)].sort(function(a, b) {
                    if(a === b || self.getDirection() === "stopped") return 0;
                    
                    if(a === self.currentFloor()) return -1;
                    if(b === self.currentFloor()) return 1;
                    
                    if(self.getDirection() === "up") {
                        if(a > self.currentFloor()) {
                            if(b < self.currentFloor()) return -1;
                            if(b > self.currentFloor()) return a-b;
                        } 
                        if(a < self.currentFloor()) {
                            if(b < self.currentFloor()) return b-a;
                            if(b > self.currentFloor()) return 1;
                        }
                    } else if(self.getDirection() === "down") {    
                        if(a > self.currentFloor()) {
                            if(b < self.currentFloor()) return 1;
                            if(b > self.currentFloor()) return a-b;
                        } 
                        if(a < self.currentFloor()) {
                            if(b < self.currentFloor()) return b-a;
                            if(b > self.currentFloor()) return -1;
                        }
                    };
                    return 0;
                });
                this.checkDestinationQueue();
            }
            elevator.goTo(Math.floor(Math.random() * floors.length));
            elevator.on("passing_floor", function(floorNum, direction) {
                if(floors[floorNum].buttonStates.up !== "activated" && floors[floorNum].buttonStates.down !== "activated") {
                    this.skipFloor(floorNum);
                    return;
                }
                if(((this.getDirection() === "up" && floors[floorNum].buttonStates.up !== "activated") ||
                   (this.getDirection() === "down" && floors[floorNum].buttonStates.down !== "activated")
                   )) {
                    for(var e of elevators) {
                        if(!e.getPressedFloors().includes(floorNum)) e.skipFloor(floorNum);
                    }
                    return;
                }
                   
                
                if(!this.isFull() && (
                   (this.getDirection() === "down" && 
                   floors[floorNum].buttonStates.down === "activated") ||
                    (this.getDirection() === "up" && 
                     floors[floorNum].buttonStates.up === "activated")
                  )) {
                    this.goTo(floorNum);
                }
            });
            
            elevator.on("idle", function() {
                this.log("IDLE");
                if(this.currentFloor() != 0) this.goTo(0);
                else this.goTo(floors.length-1);
            });
            
            elevator.on("floor_button_pressed", function(floorNum) {
                this.goTo(floorNum);
            });
            
            elevator.on("stopped_at_floor", function(floorNum ) {
                this.log("STOPPED");
                this.setIndicators();
            })
        }
        
        for(var floor of floors) {
            floor.on("up_button_pressed down_button_pressed ", function() {
                var self = this;
                var elevator = elevators.find(function(e) {
                    e.getDirection() === "stopped";
                })|| elevators[Math.floor(Math.random() * elevators.length)]
                //elevator.goTo(this.floorNum());
            })
        }
    },
    update: function(dt, elevators, floors) {}
}
