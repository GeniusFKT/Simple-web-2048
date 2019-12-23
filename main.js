// get canvas and its context
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

class FilletRectangle
{
    constructor(X, Y, width, height, radius, color)
    {
        // X, Y: left top coordinate
        this.X = X;
        this.Y = Y;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.color = color;
    }

    draw()
    {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.moveTo(this.X, this.Y + this.radius);
        ctx.lineTo(this.X, this.Y + this.height - this.radius);
        ctx.quadraticCurveTo(this.X, this.Y + this.height, this.X + this.radius, this.Y + this.height);
        ctx.lineTo(this.X + this.width - this.radius, this.Y + this.height);
        ctx.quadraticCurveTo(this.X + this.width, this.Y + this.height, this.X + this.width, this.Y + this.height - this.radius);
        ctx.lineTo(this.X + this.width, this.Y + this.radius);
        ctx.quadraticCurveTo(this.X + this.width, this.Y, this.X + this.width - this.radius, this.Y);
        ctx.lineTo(this.X + this.radius, this.Y);
        ctx.quadraticCurveTo(this.X, this.Y, this.X, this.Y + this.radius);
        ctx.fill();
    }
}

let r = new FilletRectangle(width / 2, height / 2, width / 3, height / 3, 10, 'rgb(100, 100, 100)');
r.draw();
