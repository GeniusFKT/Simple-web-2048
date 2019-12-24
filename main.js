// get canvas and its context
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');



const width = canvas.width = window.innerWidth - 20;
const height = canvas.height = window.innerHeight - 20;

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
        this.numbers = [[2, 4, 16, 8], [128, 4, 2048, 256], [2, 4, 8, 2], [2, 2, 256, 2]];
        this.num2color = new Map([[2, "rgb(255, 222, 173)"], [4, "rgb(255, 218, 185)"], [8, "rgb(238, 220, 130)"], [16, "rgb(205, 198, 115)"], [32, "rgb(255, 193, 37)"], [64, "rgb(205, 155, 29)"], [128, "rgb(139, 117, 0)"], [256, "rgb(210, 105, 30)"], [512, "rgb(160, 82, 45)"], [1024, "rgb(139, 69, 19)"], [2048, "rgb(165, 42, 42)"]]);
        this.num2font = new Map([[1, "normal normal bold 150px arial"], [2, "normal normal bold 120px arial"], [3, "normal normal bold 90px arial"], [4, "normal normal bold 70px arial"]]);
        this.num2y_offset = new Map([[1, 10], [2, 8], [3, 6], [4, 0]]);
        this.text_x_offset = grid_size / 2;
        this.text_y_offset = grid_size / 2 + 10;
        this.two_ratio = 0.8;
    }

    // draw current status
    draw()
    {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                if (this.numbers[i][j] === 0)
                    continue;
                else
                {
                    // draw grids' color
                    let color = this.num2color.get(this.numbers[i][j]);
                    if (color === undefined)
                        color = this.num2color.get(2048);
                    let rec = new FilletRectangle(width / 2 - height / 2 + j * (gap + grid_size) + gap, i * (gap + grid_size) + gap, grid_size, grid_size, 5, color);
                    rec.draw();

                    // draw numbers (white)
                    let digits = Math.ceil(Math.log10(this.numbers[i][j]));
                    ctx.fillStyle = "rgb(255, 255, 255)";
                    ctx.font = this.num2font.get(digits);
                    this.text_y_offset = grid_size / 2 + this.num2y_offset.get(digits);
                    // set baseline
                    ctx.textBaseline = "middle";
                    // align based on x values in fillText
                    ctx.textAlign = "center";
                    ctx.fillText(String(this.numbers[i][j]), width / 2 - height / 2 + j * (gap + grid_size) + gap + this.text_x_offset, i * (gap + grid_size) + gap + this.text_y_offset);
                }
    }

    // check game status
    isGameOver()
    {
        // check zero
        if (this.numbers.some(ele => ele.includes(0)))
            return false;

        // check adjacent values
        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
            {
                // check columns
                if (i < 3)
                    if (this.numbers[i][j] === this.numbers[i + 1][j])
                        return false;
                
                // check rows
                if (j < 3)
                    if (this.numbers[i][j] === this.numbers[i][j + 1])
                        return false;
            }

        return true;
    }

    generateRandomNumber()
    {
        let indices = [];
        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
            {
                if (this.numbers[i][j] === 0)
                    indices.push([i, j]); 
            }

        let index = indices[Math.floor(helper.random_minmax(0, indices.length))];

        if (helper.random_minmax(0, 1) < this.two_ratio)
            this.numbers[index[0]][index[1]] = 2;
        else
            this.numbers[index[0]][index[1]] = 4;
    }

    popOut()
    {
        
    }
}

class helper
{
    static random_minmax(min, max)
    {
        return Math.random() * (max - min) + min;
    }
}

let NG = new NumberGrids();
NG.draw();
