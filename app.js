/**
 * app.js - Physics Engine for Multi-Body Gravity Simulator
 * Handles vector math, object properties, and the physics tick loop.
 */

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let m = this.mag();
        if (m !== 0) {
            return this.mult(1 / m);
        }
        return new Vector(0, 0);
    }
}

class Body {
    constructor(x, y, mass, color) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.mass = mass;
        this.radius = Math.sqrt(this.mass) * 2; // Size relative to mass
        this.color = color;
    }

    applyForce(force) {
        let f = force.mult(1 / this.mass);
        this.acc = this.acc.add(f);
    }

    update() {
        this.vel = this.vel.add(this.acc);
        this.pos = this.pos.add(this.vel);
        this.acc = new Vector(0, 0); // Reset acceleration each frame
    }

    attract(otherBody, G) {
        let force = this.pos.sub(otherBody.pos);
        let distance = force.mag();
        
        // Constrain distance to prevent extreme forces at close range
        distance = Math.max(distance, 5); 
        
        force = force.normalize();
        let strength = (G * this.mass * otherBody.mass) / (distance * distance);
        force = force.mult(strength);
        return force;
    }

    checkCollision(otherBody) {
        let distanceVect = this.pos.sub(otherBody.pos);
        let distanceMag = distanceVect.mag();
        let minDistance = this.radius + otherBody.radius;

        if (distanceMag < minDistance) {
            // Calculate distance correction (push apart)
            let distanceCorrection = (minDistance - distanceMag) / 2.0;
            let d = distanceVect.normalize();
            let correctionVector = d.mult(distanceCorrection);
            
            this.pos = this.pos.add(correctionVector);
            otherBody.pos = otherBody.pos.sub(correctionVector);

            // Calculate relative velocity
            let relativeVelocity = this.vel.sub(otherBody.vel);
            
            // Calculate relative velocity in terms of the normal direction
            let velocityAlongNormal = (relativeVelocity.x * d.x) + (relativeVelocity.y * d.y);
            
            // Do not resolve if velocities are separating
            if (velocityAlongNormal > 0) return;

            // Restitution (bounciness)
            let e = 0.8; 

            // Impulse scalar
            let j = -(1 + e) * velocityAlongNormal;
            j /= (1 / this.mass) + (1 / otherBody.mass);

            // Apply impulse
            let impulse = d.mult(j);
            this.vel = this.vel.add(impulse.mult(1 / this.mass));
            otherBody.vel = otherBody.vel.sub(impulse.mult(1 / otherBody.mass));
        }
    }
}

class PhysicsEngine {
    constructor(gravityConstant = 0.5) {
        this.bodies = [];
        this.G = gravityConstant;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    clearBodies() {
        this.bodies = [];
    }

    step() {
        // 1. Calculate gravitational forces
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = 0; j < this.bodies.length; j++) {
                if (i !== j) {
                    let force = this.bodies[i].attract(this.bodies[j], this.G);
                    this.bodies[j].applyForce(force);
                }
            }
        }

        // 2. Check and resolve collisions
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                this.bodies[i].checkCollision(this.bodies[j]);
            }
        }

        // 3. Update positions
        for (let body of this.bodies) {
            body.update();
        }
    }
}

// Export for use in script.js
window.Vector = Vector;
window.Body = Body;
window.PhysicsEngine = PhysicsEngine;
