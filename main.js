// get canvas and its context
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;

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


let background = new FilletRectangle(width / 2 - height / 2, 0, height, height, 10, 'rgb(100, 100, 100)');
background.draw();

let grids = [];
const gap = 10;
const grid_size = (height - 5 * gap) / 4;

for (let i = 0; i < 4; i++) 
{
    for (let j = 0; j < 4; j++)
    {
        let grid = new FilletRectangle(width / 2 - height / 2 + j * (gap + grid_size) + gap, i * (gap + grid_size) + gap, grid_size, grid_size, 5, 'rgb(50, 50, 50)');
        grids.push(grid);
    }
}

for (let i = 0; i < grids.length; ++i)
{
    grids[i].draw();
}


class NumberGrids
{
    constructor()
    {
        this.numbers = [[2, 0, 0, 0], [0, 4, 0, 0], [0, 0, 8, 0], [0, 0, 0, 0]];
        this.num2color = new Map([[2, "rgb(255, 222, 173)"], [4, "rgb(255, 218, 185)"], [8, "rgb(238, 220, 130)"], [16, "rgb(205, 198, 115)"], [32, "rgb(255, 193, 37)"], [64, "rgb(205, 155, 29)"], [128, "rgb(139, 117, 0)"], [256, "rgb(210, 105, 30)"], [512, "rgb(160, 82, 45)"], [1024, "rgb(139, 69, 19)"], [2048, "rgb(165, 42, 42)"]]);
        this.text = document.getElementById("numbers");
    }

    draw()
    {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                if (this.numbers[i][j] === 0)
                    continue;
                else
                {
                    let color = this.num2color.get(this.numbers[i][j]);
                    if (color === undefined)
                        color = this.num2color.get(2048);
                    let rec = new FilletRectangle(width / 2 - height / 2 + j * (gap + grid_size) + gap, i * (gap + grid_size) + gap, grid_size, grid_size, 5, color);
                    rec.draw();
                    let newContainer = document.createElement("div");
                    let newContent = document.createElement("span"); 
                    newContent.setAttribute("padding-left", String(width / 2 - height / 2 + j * (gap + grid_size) + gap) + "px");
                    newContent.setAttribute("padding-top", String(i * (gap + grid_size) + gap) + "px");
                    newContent.textContent = String(this.numbers[i][j]);
                    this.text.appendChild(newContent);
                }
    }
}

let NG = new NumberGrids();
NG.draw();
