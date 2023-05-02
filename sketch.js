const DEBUG = 0;
const NUM_OF_BOIDS = 500;
const FRAME_RATE = 45;

function debug() {
    if (DEBUG) {
        print.apply(null, arguments);
    }
}

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    scale(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }
    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    static sAdd(v1, v2) {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }
    static sSub(v1, v2) {
        return new Vec2(v1.x - v2.x, v1.y - v2.y);
    }
    static distance(v1, v2) {
        return Vec2.sSub(v1, v2).norm();
    }
    static upperLimit(v, limit) {
        var norm = v.norm();
        if (norm > limit) {
            return v.scale( limit / norm );
        }
        return v;
    }
}

class Boid {
    static radius = 10;
    static maxV = 10;
    static visualRange = 100;
    static avoidRange = 30;
    static CohesionFactoor = 0.005;
    static SeparationFactor = 0.05;
    static AlignmentFactor = 0.005;
    static Margin = 100;

    constructor(i){
        this.id = i;
        this.pos = new Vec2(Math.random() * width,  Math.random() * height);
        this.vel = new Vec2(Math.random() * Boid.maxV - Boid.maxV/2, Math.random() * Boid.maxV - Boid.maxV/2) ;
    }

    updatePos() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        if( this.pos.x > width ) {
            this.pos.x = (2 * width) - this.pos.x;
            this.vel.x *= -1;
        }
        else if (this.pos.x < 0) {
            this.pos.x *= -1;
            this.vel.x *= -1;
        }
        if( this.pos.y > height ) {
            this.pos.y = (2 * height) - this.pos.y;
            this.vel.y *= -1;
        }
        else if (this.pos.y < 0) {
            this.pos.y *= -1;
            this.vel.y *= -1;
        }
    }

    update() {
        this.updateVelocity();
        this.updatePos();
    }

    updateVelocity() {
        var numInVisualRange = 0;
        var numInAvoidRange = 0;
        var gravityOfFlocks = new Vec2(0, 0);
        var separationVec = new Vec2(0, 0);
        var alignmentVec = new Vec2(0, 0);

        for (var i = 0; i < NUM_OF_BOIDS; i++) {
            if (i == this.id) {
                continue;
            }
            var distance = Vec2.distance(this.pos, boids[i].pos);
            if ( distance < Boid.visualRange ){
                // gravity of boids
                gravityOfFlocks.add(boids[i].pos);
                // velocity of flocks
                alignmentVec.add(boids[i].vel);
                numInVisualRange += 1;
            }
            if (distance < Boid.avoidRange) {
                // separation vector
                var delta = Vec2.sSub(this.pos, boids[i].pos); // 変位
                var normOfDelta = delta.norm();
                var normOfSVec =  - normOfDelta + Boid.avoidRange; // 近いほど 強く離れる 
                delta.scale(normOfSVec/normOfDelta);
                separationVec.add(delta);
                numInAvoidRange += 1;
            }
        }

        var vForCohesion = new Vec2(0,0);
        var vForAlignment = new Vec2(0,0);
        var vForSeparation = new Vec2(0,0);

        if (numInVisualRange > 0) {
            gravityOfFlocks.scale(1/numInVisualRange);
            vForCohesion = Vec2.sSub(gravityOfFlocks, this.pos);
            vForAlignment = alignmentVec;
        }
        if (numInAvoidRange > 0) {
            vForSeparation = separationVec;
        }
        
        var deltaV = new Vec2(0,0)
            .add(vForCohesion.scale(Boid.CohesionFactoor))
            .add(separationVec.scale(Boid.SeparationFactor))
            .add(alignmentVec.scale(Boid.AlignmentFactor));

        this.vel = Boid.limitV(this.vel.add(deltaV));

        // 壁に近づくとゆっくりになる
        if (this.pos.x < Boid.Margin) {
            this.vel.x += 1;
        }
        if (this.pos.x > width - Boid.Margin) {
            this.vel.x -= 1;
        }
        if (this.pos.y < Boid.Margin) {
            this.vel.y += 1;
        }
        if (this.pos.y > height - Boid.Margin) {
            this.vel.y -= 1;
        }

    } 

    display() {
        push();
        noStroke();
        translate(this.pos.x, this.pos.y);
        rotate(Math.atan2(this.vel.y, this.vel.x)+4/PI);
        triangle(-5, 5, 0, -7, 5, 5);
//        circle(0, 0, 10);
        pop();
    }

    static limitV(v) {
        var result =  Vec2.upperLimit(v, Boid.maxV);
        return result;
    }

}

class SliderWithLabel {
    constructor(posX, posY, text, min, max, initValue) {
        this.min = min;
        this.max = max;
        this.label = createSpan(text);
        this.label.position(posX, posY)
        this.label.style("width", "100px");
        var lSize = this.label.size();
        this.slider = createSlider(0, 100, (initValue-min)/(max-min)*100);
        this.slider.position(posX + lSize.width, posY);
        this.vLabel = createSpan(initValue);
        this.vLabel.position(this.slider.position().x + this.slider.size().width + 5, posY);
    } 

    value() {
        return this.min + (this.max - this.min) * 0.01 * this.slider.value();
    }

    update() {
        var v = this.value();
        this.vLabel.html( Math.round(v * 1000) / 1000);
    }

    bottom() {
        return this.label.position().y + this.label.size().height;
    }

}


var boids = [];
function initBoids() {
    for (var i = 0; i < NUM_OF_BOIDS; i++) {
        boids.push(new Boid(i));
    }
}


var cohesionSlider;
var separationSlider;
var alignmentSlider;;

function setupUI() {
    cohesionSlider = new SliderWithLabel(10, 10, "Cohesion", 0.001, 0.1, 0.005);
    separationSlider = new SliderWithLabel(10, cohesionSlider.bottom(), "Separation", 0.001, 0.1, 0.05);
    alignmentSlider = new SliderWithLabel(10, separationSlider.bottom(), "Alignment", 0.001, 0.1, 0.005);
}

function updateUI(){
    cohesionSlider.update();
    separationSlider.update();
    alignmentSlider.update();
}

function setup() {
    createCanvas(800, 600);
    setupUI();
    initBoids();
    frameRate(FRAME_RATE);
}

function draw() {
    resizeCanvas(window.innerWidth-10, window.innerHeight-10);
    background(150);
    updateUI();
    Boid.CohesionFactoor = cohesionSlider.value();
    Boid.SeparationFactor = separationSlider.value();
    Boid.AlignmentFactor = alignmentSlider.value();
    for (var i = 0; i < NUM_OF_BOIDS; i++) {
        boids[i].update();
        boids[i].display();
    }
//    noLoop();
}



