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
        this.numbers = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        this.num2color = new Map([[2, "rgb(255, 222, 173)"], [4, "rgb(255, 218, 185)"], [8, "rgb(238, 220, 130)"], [16, "rgb(205, 198, 115)"], [32, "rgb(255, 193, 37)"], [64, "rgb(205, 155, 29)"], [128, "rgb(139, 117, 0)"], [256, "rgb(210, 105, 30)"], [512, "rgb(160, 82, 45)"], [1024, "rgb(139, 69, 19)"], [2048, "rgb(165, 42, 42)"]]);
        this.num2font = new Map([[1, "normal normal bold 150px arial"], [2, "normal normal bold 120px arial"], [3, "normal normal bold 90px arial"], [4, "normal normal bold 70px arial"]]);
        this.num2y_offset = new Map([[1, 10], [2, 8], [3, 6], [4, 0]]);
        this.text_x_offset = grid_size / 2;
        this.text_y_offset = grid_size / 2 + 10;
        this.two_ratio = 0.8;
        this.pop_out_velocity = 8;
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
                    this.draw_number([i, j]);
                }
    }

    draw_number(index)
    {
        let digits = Math.ceil(Math.log10(this.numbers[index[0]][index[1]]));
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = this.num2font.get(digits);
        this.text_y_offset = grid_size / 2 + this.num2y_offset.get(digits);
        // set baseline
        ctx.textBaseline = "middle";
        // align based on x values in fillText
        ctx.textAlign = "center";
        ctx.fillText(String(this.numbers[index[0]][index[1]]), width / 2 - height / 2 + index[1] * (gap + grid_size) + gap + this.text_x_offset, index[0] * (gap + grid_size) + gap + this.text_y_offset);
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

        let index = indices[Math.floor(Helper.random_minmax(0, indices.length))];

        if (Helper.random_minmax(0, 1) < this.two_ratio)
            this.numbers[index[0]][index[1]] = 2;
        else
            this.numbers[index[0]][index[1]] = 4;

        this.popOut(index);
    }

    popOut(index)
    {
        // get grid center coordinate
        let x_offset = width / 2 - height / 2 + index[1] * (gap + grid_size) + gap + grid_size / 2;
        let y_offset = index[0] * (gap + grid_size) + gap + grid_size / 2;
        let y_final = index[0] * (gap + grid_size) + gap;

        let animate = new AnimatePopOut(this.pop_out_velocity, x_offset, y_offset, y_final, this.numbers[index[0]][index[1]], this.num2font.get(1), this.num2y_offset.get(1), this.num2color.get(this.numbers[index[0]][index[1]]));

        // popout animation loop
        function loop()
        {
            animate.update();
            animate.draw();

            if (animate.y_offset >= animate.y_final)
                window.requestAnimationFrame(loop);
        }

        loop();
    }
}

class Helper
{
    static random_minmax(min, max)
    {
        return Math.random() * (max - min) + min;
    }
}

class AnimatePopOut
{
    constructor(velocity, x_offset, y_offset, y_final, number, font, text_y_offset, color)
    {
        this.velocity = velocity;
        this.x_offset = x_offset;
        this.y_offset = y_offset;
        this.y_final = y_final;
        this.number = number;
        this.font = font;
        this.text_y_offset = text_y_offset;
        this.color = color;
        this.x_offset_const = x_offset;
        this.y_offset_const = y_offset;
    }

    draw()
    {
        // draw rec
        let rec_size = grid_size - 2 * (this.y_offset - this.y_final);
        let rec_radius = 5 / grid_size * rec_size;
        let rec = new FilletRectangle(this.x_offset, this.y_offset, rec_size, rec_size, rec_radius, this.color);
        rec.draw();
        
        // draw number with corresponding size
        ctx.fillStyle = "rgb(255, 255, 255)";
        let font_size = 150;
        font_size = Math.floor(font_size / grid_size * rec_size);
        let new_font = this.font.substr(0, 19) + String(font_size) + this.font.substr(22, 8);
        ctx.font = new_font;
        console.log(new_font);
        // set baseline
        ctx.textBaseline = "middle";
        // align based on x values in fillText
        ctx.textAlign = "center";
        ctx.fillText(String(this.number), this.x_offset_const, this.y_offset_const + this.text_y_offset);
    }

    update()
    {
        this.y_offset -= this.velocity;
        this.x_offset -= this.velocity;
    }
}




let NG = new NumberGrids();

document.addEventListener("keypress", function (e) {NG.generateRandomNumber();});
//document.onkeypress = NG.generateRandomNumber;