const DEBUG = 0;
const NUM_OF_BOIDS = 200;
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
    static MaxV = 14;
    static VisualRange = 100;
    static AvoidRange = 40;
    static CohesionFactoor = 0.005;
    static SeparationFactor = 0.05;
    static AlignmentFactor = 0.005;

    constructor(i){
        this.id = i;
        this.pos = new Vec2(Math.random() * width,  Math.random() * height);
        this.vel = new Vec2(Math.random() * Boid.MaxV - Boid.MaxV/2, Math.random() * Boid.MaxV - Boid.MaxV/2) ;
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
            if ( distance < Boid.VisualRange ){
                // gravity of boids
                gravityOfFlocks.add(boids[i].pos);
                // velocity of flocks
                alignmentVec.add(boids[i].vel);
                numInVisualRange += 1;
            }
            if (distance < Boid.AvoidRange) {
                // separation vector
                var delta = Vec2.sSub(this.pos, boids[i].pos); // 変位
                var normOfDelta = delta.norm();
                var normOfSVec =  - normOfDelta + Boid.AvoidRange; // 近いほど 強く離れる 
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
        var margin = Boid.VisualRange
        var vx = margin / Math.abs(this.vel.x) / 2;
        var vy = margin / Math.abs(this.vel.y) / 2;
        if (this.pos.x < margin) {
            this.vel.x += 3;
        }
        if (this.pos.x > width - margin) {
            this.vel.x -= 3;
        }
        if (this.pos.y < margin) {
            this.vel.y += 3; 
        }
        if (this.pos.y > height - margin) {
            this.vel.y -= 3;
        }

    } 

    display(showRange) {
        push();
        noStroke();
        translate(this.pos.x, this.pos.y);
        if (showRange) {
            fill(color(255, 0, 0, 100));
            circle(0, 0, Boid.VisualRange*2);
            fill(color(0, 255, 0, 100));
            circle(0, 0, Boid.AvoidRange*2);
        }
        fill(256);
        rotate(Math.atan2(this.vel.y, this.vel.x)+4/PI);
        triangle(-5, 5, 0, -7, 5, 5);
//        circle(0, 0, 10);
        pop();
    }

    static limitV(v) {
        var result =  Vec2.upperLimit(v, Boid.MaxV);
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
var avoidRangeSlider;

function setupUI() {
    cohesionSlider = new SliderWithLabel(10, 10, "Cohesion", 0.001, 0.1, 0.005);
    separationSlider = new SliderWithLabel(10, cohesionSlider.bottom(), "Separation", 0.001, 0.1, 0.05);
    alignmentSlider = new SliderWithLabel(10, separationSlider.bottom(), "Alignment", 0.001, 0.1, 0.005);
    visualRangeSlider = new SliderWithLabel(10, alignmentSlider.bottom(), "VisualRange", 1, 200, 100);
    avoidRangeSlider = new SliderWithLabel(10, visualRangeSlider.bottom(), "AvoidRange", 1, 100, 30);
}

function updateUI(){
    cohesionSlider.update();
    separationSlider.update();
    alignmentSlider.update();
    visualRangeSlider.update();
    avoidRangeSlider.update();
}

function updateParameter(){
    Boid.CohesionFactoor = cohesionSlider.value();
    Boid.SeparationFactor = separationSlider.value();
    Boid.AlignmentFactor = alignmentSlider.value();
    Boid.AvoidRange = avoidRangeSlider.value();
    Boid.VisualRange = visualRangeSlider.value();
}

function setup() {
    createCanvas(window.innerWidth-10, window.innerHeight-10);
    setupUI();
    initBoids();
    frameRate(FRAME_RATE);
}

function draw() {
    resizeCanvas(window.innerWidth-10, window.innerHeight-10);
    background(150);
    updateUI();
    updateParameter();
    for (var i = 0; i < NUM_OF_BOIDS; i++) {
        boids[i].update();
        boids[i].display( DEBUG && i == 0);
    }
//    noLoop();
}



