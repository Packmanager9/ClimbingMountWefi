
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {

            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            if(this == jumpler.body ){ //|| this == slogbo.body
                canvas_context.translate(-this.xmom, -this.ymom)
            }
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }  
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if(this.body == jumpler.body || this.anchor ==jumpler.body || this.body == slogbo.body || this.anchor ==slogbo.body){
                if(this.body == jumpler.body || this.body == slogbo.body){

                    if(this.body == jumpler.body ){

                        if (this.beam.hypotenuse() < this.length) {
                            this.body.xmom += (((this.body.x - this.anchor.x) / this.length) )*jumpler.grounded*.05
                            this.body.ymom += (((this.body.y - this.anchor.y) / this.length) )*jumpler.grounded*.05
                            this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                            this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
                        } else if (this.beam.hypotenuse() > this.length) {
                            this.body.xmom -= ((this.body.x - this.anchor.x) / (this.length))*jumpler.grounded*.05
                            this.body.ymom -=( (this.body.y - this.anchor.y) / (this.length))*jumpler.grounded*.05
                            this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                            this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
                        }
                    }else{
                        if (this.beam.hypotenuse() < this.length) {
                            this.body.xmom += (((this.body.x - this.anchor.x) / this.length) )*.2
                            this.body.ymom += (((this.body.y - this.anchor.y) / this.length) )*.2
                            this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                            this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
                        } else if (this.beam.hypotenuse() > this.length) {
                            this.body.xmom -= ((this.body.x - this.anchor.x) / (this.length))*.2
                            this.body.ymom -=( (this.body.y - this.anchor.y) / (this.length))*.2
                            this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                            this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
                        }
                    }
                }else{

                    if(this.anchor == jumpler.body ){

                        if (this.beam.hypotenuse() < this.length) {
                            this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                            this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                            this.anchor.xmom -= (((this.body.x - this.anchor.x) / this.length) )*jumpler.grounded*.05
                            this.anchor.ymom -= (((this.body.y - this.anchor.y) / this.length) )*jumpler.grounded*.05
                        } else if (this.beam.hypotenuse() > this.length) {
                            this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                            this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                            this.anchor.xmom +=( (this.body.x - this.anchor.x) / (this.length))*jumpler.grounded*.05
                            this.anchor.ymom +=( (this.body.y - this.anchor.y) / (this.length))*jumpler.grounded*.05
                        }
                    }else{

                        if (this.beam.hypotenuse() < this.length) {
                            this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                            this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                            this.anchor.xmom -= (((this.body.x - this.anchor.x) / this.length) )*.2
                            this.anchor.ymom -= (((this.body.y - this.anchor.y) / this.length) )*.2
                        } else if (this.beam.hypotenuse() > this.length) {
                            this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                            this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                            this.anchor.xmom +=( (this.body.x - this.anchor.x) / (this.length))*.2
                            this.anchor.ymom +=( (this.body.y - this.anchor.y) / (this.length))*.2
                        }
                    }
                }

            // let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            // let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            // this.body.xmom = ((this.body.xmom*3) + xmomentumaverage) / 4
            // this.body.ymom = ((this.body.ymom*3) + ymomentumaverage) / 4
            // this.anchor.xmom = ((this.anchor.xmom*3) + xmomentumaverage) / 4
            // this.anchor.ymom = ((this.anchor.ymom*3) + ymomentumaverage) / 4
            }else{

                if (this.beam.hypotenuse() < this.length) {
                    this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                    this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                    this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                    this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
                } else if (this.beam.hypotenuse() > this.length) {
                    this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                    this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                    this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                    this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
                }
    
                let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
                let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
                this.body.xmom = ((this.body.xmom*3) + xmomentumaverage) / 4
                this.body.ymom = ((this.body.ymom*3) + ymomentumaverage) / 4
                this.anchor.xmom = ((this.anchor.xmom*3) + xmomentumaverage) / 4
                this.anchor.ymom = ((this.anchor.ymom*3) + ymomentumaverage) / 4

            }
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#AAAAFF") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            window.addEventListener('pointermove', continued_stimuli);
        });
        window.addEventListener('pointerup', e => {
            window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
//         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[0] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function slogbocontrol(object, speed = 1) { // basic control for objects

        let objc = {}
        objc.x = object.body.x
        objc.y = object.body.y
        if (typeof object.body != 'undefined') {
            if (keysPressed['i']) {
                if(object.grounded == 1){
                object.body.y -= speed
                object.body.ymom -= speed/10
                    object.body.ymom = -19
                    object.grounded = 0
                }
            }
            if (keysPressed['l']) {
                object.body.xmom += speed/10
                object.body.x += speed
            }
            if (keysPressed['k']) {
                // object.body.y += speed
                // object.body.ymom += speed/10
            }
            if (keysPressed['j']) {
                object.body.x -= speed
                object.body.xmom -= speed/10
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['i']) {
                object.y -= speed
            }
            if (keysPressed['l']) {
                object.x += speed
            }
            if (keysPressed['k']) {
                object.y += speed
            }
            if (keysPressed['j']) {
                object.x -= speed
            }
        }
        // canvas_context.translate((objc.x-object.body.x), (objc.y-object.body.y))

    }
    function jumplercontrol(object, speed = 1) { // basic control for objects
        let objc = {}
        objc.x = object.body.x
        objc.y = object.body.y
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                if(object.grounded == 1){
                object.body.y -= speed
                object.body.ymom -= speed/440
                    object.body.ymom = -11.5
                    object.grounded = 0
                }
            }
            if (keysPressed['d']) {
                if(object.body.xmom <0){
                    object.body.xmom*=.98
                }
                object.body.x += speed
                object.body.xmom += speed/440
            }
            if (keysPressed['s']) {
                // object.body.y += speed
                // object.body.ymom += speed/440
            }
            if (keysPressed['a']) {
                if(object.body.xmom >0){
                    object.body.xmom*=.98
                }
                object.body.x -= speed
                object.body.xmom -= speed/440
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
        canvas_context.translate((objc.x-object.body.x), (objc.y-object.body.y))
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomWhite() { // random color
        var letters = 'DEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 3) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    class Jumpler{
        constructor(){
            this.body = new Circle(700, 550, 10, "#FF88AA")
            this.body.linked = []
            this.rope = []
            this.ropepoints = []
            this.grounded = 1
            this.dir = -1
            for(let t = 0;t<10;t++){
                this.ropepoint = new Circle(700-(t*40),550+(t*5), 25, "#FFAAFF")
                this.ropepoint.linked = []
                this.ropepoints.push(this.ropepoint)
            }

            this.ropepoints.push(this.body)

            this.ropepoints.push(slogbo.body)
            for(let t = 0;t<this.ropepoints.length;t++){
                for(let k = 0;k<this.ropepoints.length;k++){
                    if(t!=k){
                        if(this.ropepoints[t].doesPerimeterTouch(this.ropepoints[k])){
                            if(!this.ropepoints[k].linked.includes(t)){
                                if(!this.ropepoints[t].linked.includes(k)){
                                this.ropepoints[k].linked.push(t)
                                this.ropepoints[t].linked.push(k)
                                this.spring = new SpringOP(this.ropepoints[t], this.ropepoints[k], 15, 5)
                                this.rope.push(this.spring)
                                }
                            }
                        }
                    }
                }
            }
            for(let t = 0;t<this.ropepoints.length;t++){
                this.ropepoints[t].radius = 6
            }
        }
        isAway(){
            let point = new Point(this.body.x+this.body.xmom, this.body.y+this.body.ymom)
            let l1 = new LineOP(point, slogbo.body)
            let l2 = new LineOP(this.body, slogbo.body)
            if(l1.hypotenuse() > l2.hypotenuse()){
                return true
            }else{
                return false
            }
        }
        draw(){
            let link = new LineOP(this.body, slogbo.body)
            if(link.hypotenuse() > 720){
                            
                    // let scale = Math.max(((1280*2) - link.hypotenuse())/(1280*4),.1)
                    // // canvas_context.scale(invscale,invscale)
                    // canvas_context.translate(-goback.x,-goback.y)
                    // goback.x = (1280*invscale)-jumpler.body.x
                    // goback.y =  (720*invscale)-jumpler.body.y
                    // invscale = 1/scale
                    // canvas_context.translate((1280*invscale)-jumpler.body.x,(720*invscale)-jumpler.body.y)
                    // // canvas_context.scale(scale,scale)


                    //  canvas_context.setTransform(1, 1, 1, 1, 0, 0)
            if(link.hypotenuse() > 1280){
                if(this.isAway()){
                    jumpler.body.xmom*=-.99
                    jumpler.body.ymom*=-.99
                }
                if(slogbo.body.ymom > 0){
                    slogbo.body.ymom*=.95
                }
                for(let t = 0;t<this.rope.length;t++){
                    this.rope[t].length = 5
                }
                for(let t = 0;t<this.rope.length;t++){
                    this.rope[t].balance()
                }
                this.body.move()
            }
            }else{
                
                let scale = Math.max(((1280*2) - link.hypotenuse())/(1280*4),.1)
                // canvas_context.scale(invscale,invscale)
                // canvas_context.translate(-goback.x,-goback.y)
                // goback.x = (1280*invscale)-jumpler.body.x
                // goback.y =  (720*invscale)-jumpler.body.y
                // invscale = 1/scale
                // canvas_context.translate((1280*invscale)-jumpler.body.x,(720*invscale)-jumpler.body.y)
                // canvas_context.scale(scale,scale)
                // canvas_context.setTransform(scale, scale, 0, 0, 0, 0)
                for(let t = 0;t<this.rope.length;t++){
                    this.rope[t].length = 15
                }

            }
            this.body.radius = 30
            jumplercontrol(this, 6)
            // this.body.draw()
            for(let t = 0;t<this.rope.length;t++){
                this.rope[t].balance()
            }
            for(let t = 0;t<this.ropepoints.length;t++){
                if(this.ropepoints[t] == slogbo.body || this.ropepoints[t] == jumpler.body){
                    this.ropepoints[t].ymom+=.35
                }else{
                this.ropepoints[t].ymom+=.05
                }
                this.ropepoints[t].move()
            }

            for(let t = 0;t<this.ropepoints.length;t++){
                this.ropepoints[t].draw()
            }
            for(let t = 0;t<this.rope.length;t++){
                this.rope[t].draw()
            }
            slogbo.body.draw()
            this.body.draw()

            // if(Math.random()<.1){
                if(this.body.xmom > 0 || keysPressed['d']){
                    this.dir = 1
                }else if(this.body.xmom < 0  || keysPressed['a']){
                    this.dir = -1
                }
            // }
            let eye1 = new Circle(this.body.x+(this.dir*13)-18, this.body.y- 8, 5, "#090909")
            eye1.draw()
            let eye2 = new Circle(this.body.x+(this.dir*13)+18, this.body.y- 8, 5, "#090909")
            eye2.draw()
        }
    }
    class Slogbo{
        constructor(){
            this.body = new Circle(300, 600, 50, "#FFDD44")
            this.body.linked = []
            this.grounded = 1
            this.dir = 1
        }
        draw(){
            if(Math.random()<.1){
                if(this.body.xmom > 0){
                    this.dir = 1
                }else{
                    this.dir = -1
                }
            }
            let eye1 = new Circle(this.body.x+(this.dir*13)-18, this.body.y- 8, 5, "#090909")
            eye1.draw()
            let eye2 = new Circle(this.body.x+(this.dir*13)+18, this.body.y- 8, 5, "#090909")
            eye2.draw()
            this.body.xmom*=.97
            this.body.radius = 50
            slogbocontrol(this,4)
            // this.body.draw()

            if(slogbo.body.doesPerimeterTouch(jumpler.body)){
            let link = new LineOP(slogbo.body, jumpler.body)
            let dis = link.hypotenuse() - (jumpler.body.radius+slogbo.body.radius)
            let angle = link.angle()
            slogbo.body.x -= (Math.cos(angle)*dis)
            slogbo.body.y -= (Math.sin(angle)*dis)
            jumpler.body.x += (Math.cos(angle)*dis)
            jumpler.body.y += (Math.sin(angle)*dis)
            canvas_context.translate(-(Math.cos(angle)*dis), -(Math.sin(angle)*dis))
            }
        }
    }
    let slogbo = new Slogbo()
    let jumpler = new Jumpler()


    class FloorOrb{
        constructor(x,y, r){
            this.body = new Circle(x,y, r, getRandomWhite())
        }
        draw(){
            this.body.draw()
            if(slogbo.body.doesPerimeterTouch(this.body)){
                if(slogbo.body.ymom>0){
                    slogbo.body.ymom = 0
                }
                    slogbo.body.xmom = 0

                    let link = new LineOP(slogbo.body, this.body)
                    let dis = link.hypotenuse() - (this.body.radius+slogbo.body.radius)
                    let angle = link.angle()
                    slogbo.body.x -= (Math.cos(angle)*dis)
                    slogbo.body.y -= (Math.sin(angle)*dis)
                    slogbo.grounded = 1
                    // canvas_context.translate( (Math.cos(angle)*dis),  (Math.sin(angle)*dis))
            }
            if(jumpler.body.doesPerimeterTouch(this.body)){
                jumpler.grounded = 1
                if(jumpler.body.ymom>0){
                    jumpler.body.ymom = 0
                }
                    jumpler.body.xmom *=.99


                    let link = new LineOP(jumpler.body, this.body)
                    let dis = link.hypotenuse() - (this.body.radius+jumpler.body.radius)
                    let angle = link.angle()
                    jumpler.body.x -= (Math.cos(angle)*dis)
                    jumpler.body.y -=  (Math.sin(angle)*dis)

                canvas_context.translate( (Math.cos(angle)*dis),  (Math.sin(angle)*dis))
            }

            for(let t = 0;t<jumpler.ropepoints.length;t++){
                if(jumpler.ropepoints[t].doesPerimeterTouch(this.body)){
                    jumpler.ropepoints[t].xmom*=.98
                    jumpler.ropepoints[t].ymom*=.98

                    // let link = new LineOP(jumpler.ropepoints[t], this.body)
                    // let dis = link.hypotenuse() - (this.body.radius+jumpler.ropepoints[t].radius)
                    // let angle = link.angle()
                    // jumpler.ropepoints[t].x -= (Math.cos(angle)*dis)
                    // jumpler.ropepoints[t].y -= (Math.sin(angle)*dis)
                }
            }
        }
    }

    let goback = {}
    goback.x = 1280
    goback.y = 720
    let scale = .5
    let invscale = 1/scale
    canvas_context.scale(.5,.5)
    canvas_context.translate(640,360)



    let wefi = []

    let florb1 = new FloorOrb(500, 1000,400)
    let florb2 = new FloorOrb(-100, 1000,400)
    let florb3 = new FloorOrb(900, 1000,400)
    let florb4 = new FloorOrb(-400, 400,400)
    let florb5 = new FloorOrb(1100, 700,400)
    wefi = [florb1,florb2,florb3,florb4,florb5]
    
    // canvas_context.setTransform(1, 1, 1, 1, 1, 1)

    function main() {
        canvas_context.clearRect(-100000, -10000, canvas.width*100, canvas.height*100)  // refreshes the image


        let link = new LineOP(jumpler.body, slogbo.body)
        // if(link.hypotenuse() > 720){
                        
                let scale = Math.max(((1280*2) - link.hypotenuse())/(1280*4),.1)
                //  canvas_context.setTransform(scale, scale, 0, 0, 0, 0)
                console.log(canvas_context.getTransform())
                // canvas_context.setTransform(scale, 0, 0, scale, (-jumpler.body.x)*scale, (-jumpler.body.y)*scale)
        // }

        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // game code goes here
        for(let t = 0;t<wefi.length;t++){
            wefi[t].draw()
        }
        jumpler.draw()
        slogbo.draw()
    }
})
