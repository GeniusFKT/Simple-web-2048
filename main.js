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

// draw grids and background
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
        this.pop_out_velocity = 10;
        this.move_velocity = 30;
        this.merge_velocity = 2;
        this.dt = 110;

        this.merge_status = [true, true, true, true];
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

    // draw current status with a mask (number under mask will not be drawn)
    draw_with_mask(mask)
    {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++)
                if (mask[i][j] === 0 || this.numbers[i][j] === 0)
                {
                    let grid = new FilletRectangle(width / 2 - height / 2 + j * (gap + grid_size) + gap, i * (gap + grid_size) + gap, grid_size, grid_size, 5, 'rgb(50, 50, 50)');
                    grid.draw();
                }
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

    // generate random number
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

    // new number pop out animation
    popOut(index)
    {
        // get grid center coordinate
        let x_offset = width / 2 - height / 2 + index[1] * (gap + grid_size) + gap + grid_size / 2;
        let y_offset = index[0] * (gap + grid_size) + gap + grid_size / 2;
        let y_final = index[0] * (gap + grid_size) + gap;

        let animate = new AnimatePopOut(this.pop_out_velocity, x_offset, y_offset, y_final, this.numbers[index[0]][index[1]], this.num2font.get(1), this.num2y_offset.get(1), this.num2color.get(this.numbers[index[0]][index[1]]));

        // popout animation loop
        let timer;
        let loop = function()
        {
            animate.update();
            animate.draw();

            if (animate.y_offset >= animate.y_final)
                timer = window.requestAnimationFrame(loop);
            else
                window.cancelAnimationFrame(timer);
        };

        loop();
    }

    // return the index of all grids which is moveable under specific direction
    // one step
    moveable(direction)
    {
        let indices = [];

        switch (direction) 
        {
            // up
            case "u":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = false;
                    for (let i = 0; i < 4; ++i)
                    {
                        if (flag && this.numbers[i][j] !== 0)
                            indices.push([i, j]);
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // down
            case "d":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = false;
                    for (let i = 3; i >= 0; --i)
                    {
                        if (flag && this.numbers[i][j] !== 0)
                            indices.push([i, j]);
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // left
            case "l":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = false;
                    for (let j = 0; j < 4; ++j)
                    {
                        if (flag && this.numbers[i][j] !== 0)
                            indices.push([i, j]);
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // right
            case "r":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = false;
                    for (let j = 3; j >= 0; --j)
                    {
                        if (flag && this.numbers[i][j] !== 0)
                            indices.push([i, j]);
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            default:
                throw "Invalid direction!";
        }

        return indices;
    }

    // return the index of all grids which is mergeable under specific direction
    // one step
    mergeable(direction)
    {
        let indices = [];

        switch (direction) 
        {
            // up
            case "u":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = true;
                    let flag_moveable = false;
                    for (let i = 0; i < 3; ++i)
                    {
                        if (this.numbers[i][j] === 0)
                            flag_moveable = true;
                        if (this.numbers[i][j] !== 0 && !flag_moveable && flag && this.numbers[i][j] === this.numbers[i + 1][j])
                        {
                            if (this.merge_status[j] || i != 0)
                                indices.push([i, j]);
                            flag = false;
                        }
                        else
                            flag = true;
                    }
                }
                break;
            // down
            case "d":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = true;
                    let flag_moveable = false;
                    for (let i = 3; i > 0; --i)
                    {
                        if (this.numbers[i][j] === 0)
                            flag_moveable = true;
                        if (this.numbers[i][j] !== 0 && !flag_moveable && flag && this.numbers[i][j] === this.numbers[i - 1][j])
                        {
                            if (this.merge_status[j] || i != 3)
                                indices.push([i, j]);
                            flag = false;
                        }
                        else
                            flag = true;
                    }
                }
                break;
            // left
            case "l":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = true;
                    let flag_moveable = false;
                    for (let j = 0; j < 3; ++j)
                    {
                        if (this.numbers[i][j] === 0)
                            flag_moveable = true;
                        if (this.numbers[i][j] !== 0 && !flag_moveable && flag && this.numbers[i][j] === this.numbers[i][j + 1])
                        {
                            if (this.merge_status[i] || j != 0)
                                indices.push([i, j]);
                            flag = false;
                        }
                        else
                            flag = true;
                    }
                }
                break;
            // right
            case "r":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = true;
                    let flag_moveable = false;
                    for (let j = 3; j > 0; --j)
                    {
                        if (this.numbers[i][j] === 0)
                            flag_moveable = true;
                        if (this.numbers[i][j] !== 0 && !flag_moveable && flag && this.numbers[i][j] === this.numbers[i][j - 1])
                        {
                            if (this.merge_status[i] || j != 3)
                                indices.push([i, j]);
                            flag = false;
                        }
                        else
                            flag = true;
                    }
                }
                break;
            default:
                throw "Invalid direction!";
        }

        return indices;
    }

    /*
    // update once according to given direction
    update(direction)
    {
        switch (direction) 
        {
            // up
            case "u":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = false;
                    for (let i = 0; i < 4; ++i)
                    {
                        if (flag === true && this.numbers[i][j] !== 0)
                        {
                            this.numbers[i - 1][j] = this.numbers[i][j];
                            this.numbers[i][j] = 0;
                        }
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // down
            case "d":
                for (let j = 0; j < 4; ++j)
                {
                    let flag = false;
                    for (let i = 3; i >= 0; --i)
                    {
                        if (flag === true && this.numbers[i][j] !== 0)
                        {
                            this.numbers[i + 1][j] = this.numbers[i][j];
                            this.numbers[i][j] = 0;
                        }
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // left
            case "l":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = false;
                    for (let j = 0; j < 4; ++j)
                    {
                        if (flag === true && this.numbers[i][j] !== 0)
                        {
                            this.numbers[i][j - 1] = this.numbers[i][j];
                            this.numbers[i][j] = 0;
                        }
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            // right
            case "r":
                for (let i = 0; i < 4; ++i)
                {
                    let flag = false;
                    for (let j = 3; j >= 0; --j)
                    {
                        if (flag === true && this.numbers[i][j] !== 0)
                        {
                            this.numbers[i][j + 1] = this.numbers[i][j];
                            this.numbers[i][j] = 0;
                        }
                        if (this.numbers[i][j] === 0)
                            flag = true;
                    }
                }
                break;
            default:
                throw "Invalid direction!";
        }
    }*/

    restore_merge_status()
    {
        this.merge_status = [true, true, true, true];
    }

    async move_up()
    {
        // try three times
        // need async!
        this.restore_merge_status();
        for (let _ = 0; _ < 3; ++_)
        {
            this.move_up_once();
            await Helper.sleep(this.dt);
        }
    }

    move_up_once()
    {
        // get mergeable indices
        let indices_mergeable = this.mergeable("u");

        // update merge status
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            if (indices_mergeable[i][0] === 0 || indices_mergeable[i][0] === 2)
                for (let j = i + 1; j < indices_mergeable.length; ++j)
                    if ((indices_mergeable[j][0] === 0 || indices_mergeable[j][0] === 2) && indices_mergeable[i][1] === indices_mergeable[j][1])
                        this.merge_status[indices_mergeable[i][1]] = false;
        }

        // update mergeable numbers
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]] *= 2;
            this.numbers[indices_mergeable[i][0] + 1][indices_mergeable[i][1]] = 0;
        }

        // get moveable indices after merging
        let indices_moveable = this.moveable("u");

        // update moveable (a grid can't be mergeable and moveable simutaneously)
        for (let i = 0; i < indices_mergeable.length; ++i)
            if (indices_mergeable[i][0] === 2)
                for (let j = 0; j < indices_moveable.length; ++j)
                    if (indices_moveable[j][0] === 2 && indices_moveable[j][1] === indices_mergeable[i][1])
                    {
                        indices_moveable.splice(j, 1);
                        break;
                    }
        

        // get mask
        let mask = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
        for (let i = 0; i < indices_moveable.length; ++i)
            mask[indices_moveable[i][0]][indices_moveable[i][1]] = 0;

        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
                if (this.numbers[i][j] === 0)
                    mask[i][j] = 0;

        // get animation grids
        let animates_move = [];
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let number = this.numbers[indices_moveable[i][0]][indices_moveable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_move = new AnimateMove(indices_moveable[i], "u", this.move_velocity, number, font, color, text_y_offset);

            animates_move.push(animate_move);
        }

        let animates_merge = [];
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            let number = this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_merge = new AnimateMerge(indices_mergeable[i], "u", this.merge_velocity, number, font, color, text_y_offset);

            animates_merge.push(animate_merge);            
        }

        // nothing to update
        if (animates_move.length === 0 && animates_merge.length === 0)
            return;
        
        // animation loop
        let timer;

        let loop = function()
        {
            Helper.draw_background();
            Helper.draw_with_mask(mask);

            for (let i = 0; i < animates_move.length; ++i)
            {
                animates_move[i].draw();
                animates_move[i].update();
            }

            for (let i = 0; i < animates_merge.length; ++i)
            {
                animates_merge[i].draw();
                animates_merge[i].update();
            }

            // in case of nothing to move while some grids need merged
            try 
            {
                if (animates_move[0].y_offset >= indices_moveable[0][0] * (gap + grid_size) - grid_size)
                    timer = window.requestAnimationFrame(loop);
                else
                    window.cancelAnimationFrame(timer);
            } 
            catch (TypeError)
            {
                if (animates_merge[0].x_offset === animates_merge[0].x_offset_const && !animates_merge[0].flag)
                    window.cancelAnimationFrame(timer);
                else;
                    timer = window.requestAnimationFrame(loop);
            }
        };

        loop();

        // update number grids
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let row = indices_moveable[i][0];
            let col = indices_moveable[i][1];
            this.numbers[row - 1][col] = this.numbers[row][col];
            this.numbers[row][col] = 0;
        }
    }

    async move_down()
    {
        // try three times
        // need async!
        this.restore_merge_status();
        for (let _ = 0; _ < 3; ++_)
        {
            this.move_down_once();
            await Helper.sleep(this.dt);
        }
    }

    move_down_once()
    {
        // get mergeable indices
        let indices_mergeable = this.mergeable("d");

        // update merge status
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            if (indices_mergeable[i][0] === 1 || indices_mergeable[i][0] === 3)
                for (let j = i + 1; j < indices_mergeable.length; ++j)
                    if ((indices_mergeable[j][0] === 1 || indices_mergeable[j][0] === 3) && indices_mergeable[i][1] === indices_mergeable[j][1])
                        this.merge_status[indices_mergeable[i][1]] = false;
        }

        // update mergeable numbers
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]] *= 2;
            this.numbers[indices_mergeable[i][0] - 1][indices_mergeable[i][1]] = 0;
        }

        // get moveable indices after merging
        let indices_moveable = this.moveable("d");

        // update moveable (a grid can't be mergeable and moveable simutaneously)
        for (let i = 0; i < indices_mergeable.length; ++i)
            if (indices_mergeable[i][0] === 1)
                for (let j = 0; j < indices_moveable.length; ++j)
                    if (indices_moveable[j][0] === 1 && indices_moveable[j][1] === indices_mergeable[i][1])
                    {
                        indices_moveable.splice(j, 1);
                        break;
                    }
        

        // get mask
        let mask = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
        for (let i = 0; i < indices_moveable.length; ++i)
            mask[indices_moveable[i][0]][indices_moveable[i][1]] = 0;

        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
                if (this.numbers[i][j] === 0)
                    mask[i][j] = 0;

        // get animation grids
        let animates_move = [];
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let number = this.numbers[indices_moveable[i][0]][indices_moveable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_move = new AnimateMove(indices_moveable[i], "d", this.move_velocity, number, font, color, text_y_offset);

            animates_move.push(animate_move);
        }

        let animates_merge = [];
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            let number = this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_merge = new AnimateMerge(indices_mergeable[i], "d", this.merge_velocity, number, font, color, text_y_offset);

            animates_merge.push(animate_merge);            
        }

        // nothing to update
        if (animates_move.length === 0 && animates_merge.length === 0)
            return;
        
        // animation loop
        let timer;

        let loop = function()
        {
            Helper.draw_background();
            Helper.draw_with_mask(mask);

            for (let i = 0; i < animates_move.length; ++i)
            {
                animates_move[i].draw();
                animates_move[i].update();
            }

            for (let i = 0; i < animates_merge.length; ++i)
            {
                animates_merge[i].draw();
                animates_merge[i].update();
            }

            // in case of nothing to move while some grids need merged
            try 
            {
                if (animates_move[0].y_offset <= (indices_moveable[0][0] + 1) * (gap + grid_size) + gap)
                    timer = window.requestAnimationFrame(loop);
                else
                    window.cancelAnimationFrame(timer);
            } 
            catch (TypeError)
            {
                if (animates_merge[0].x_offset === animates_merge[0].x_offset_const && !animates_merge[0].flag)
                    window.cancelAnimationFrame(timer);
                else;
                    timer = window.requestAnimationFrame(loop);
            }
        };

        loop();

        // update number grids
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let row = indices_moveable[i][0];
            let col = indices_moveable[i][1];
            this.numbers[row + 1][col] = this.numbers[row][col];
            this.numbers[row][col] = 0;
        }
    }

    async move_left()
    {
        // try three times
        // need async!
        this.restore_merge_status();
        for (let _ = 0; _ < 3; ++_)
        {
            this.move_left_once();
            await Helper.sleep(this.dt);
        }
    }

    move_left_once()
    {
        // get mergeable indices
        let indices_mergeable = this.mergeable("l");

        // update merge status
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            if (indices_mergeable[i][1] === 0 || indices_mergeable[i][1] === 2)
                for (let j = i + 1; j < indices_mergeable.length; ++j)
                    if ((indices_mergeable[j][1] === 0 || indices_mergeable[j][1] === 2) && indices_mergeable[i][0] === indices_mergeable[j][0])
                        this.merge_status[indices_mergeable[i][0]] = false;
        }

        // update mergeable numbers
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]] *= 2;
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1] + 1] = 0;
        }

        // get moveable indices after merging
        let indices_moveable = this.moveable("l");

        // update moveable (a grid can't be mergeable and moveable simutaneously)
        for (let i = 0; i < indices_mergeable.length; ++i)
            if (indices_mergeable[i][1] === 2)
                for (let j = 0; j < indices_moveable.length; ++j)
                    if (indices_moveable[j][1] === 2 && indices_moveable[j][0] === indices_mergeable[i][0])
                    {
                        indices_moveable.splice(j, 1);
                        break;
                    }
        

        // get mask
        let mask = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
        for (let i = 0; i < indices_moveable.length; ++i)
            mask[indices_moveable[i][0]][indices_moveable[i][1]] = 0;

        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
                if (this.numbers[i][j] === 0)
                    mask[i][j] = 0;

        // get animation grids
        let animates_move = [];
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let number = this.numbers[indices_moveable[i][0]][indices_moveable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_move = new AnimateMove(indices_moveable[i], "l", this.move_velocity, number, font, color, text_y_offset);

            animates_move.push(animate_move);
        }

        let animates_merge = [];
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            let number = this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_merge = new AnimateMerge(indices_mergeable[i], "l", this.merge_velocity, number, font, color, text_y_offset);

            animates_merge.push(animate_merge);            
        }

        // nothing to update
        if (animates_move.length === 0 && animates_merge.length === 0)
            return;
        
        // animation loop
        let timer;

        let loop = function()
        {
            Helper.draw_background();
            Helper.draw_with_mask(mask);

            for (let i = 0; i < animates_move.length; ++i)
            {
                animates_move[i].draw();
                animates_move[i].update();
            }

            for (let i = 0; i < animates_merge.length; ++i)
            {
                animates_merge[i].draw();
                animates_merge[i].update();
            }

            // in case of nothing to move while some grids need merged
            try 
            {
                if (animates_move[0].x_offset >= indices_moveable[0][1] * (gap + grid_size) - grid_size)
                    timer = window.requestAnimationFrame(loop);
                else
                    window.cancelAnimationFrame(timer);
            } 
            catch (TypeError)
            {
                if (animates_merge[0].x_offset === animates_merge[0].x_offset_const && !animates_merge[0].flag)
                    window.cancelAnimationFrame(timer);
                else;
                    timer = window.requestAnimationFrame(loop);
            }
        };

        loop();

        // update number grids
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let row = indices_moveable[i][0];
            let col = indices_moveable[i][1];
            this.numbers[row][col - 1] = this.numbers[row][col];
            this.numbers[row][col] = 0;
        }
    }

    async move_right()
    {
        // try three times
        // need async!
        this.restore_merge_status();
        for (let _ = 0; _ < 3; ++_)
        {
            this.move_right_once();
            await Helper.sleep(this.dt);
        }
    }

    move_right_once()
    {
        // get mergeable indices
        let indices_mergeable = this.mergeable("r");

        // update merge status
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            if (indices_mergeable[i][1] === 1 || indices_mergeable[i][1] === 3)
                for (let j = i + 1; j < indices_mergeable.length; ++j)
                    if ((indices_mergeable[j][1] === 1 || indices_mergeable[j][1] === 3) && indices_mergeable[i][0] === indices_mergeable[j][0])
                        this.merge_status[indices_mergeable[i][0]] = false;
        }

        // update mergeable numbers
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]] *= 2;
            this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1] - 1] = 0;
        }

        // get moveable indices after merging
        let indices_moveable = this.moveable("r");

        // update moveable (a grid can't be mergeable and moveable simutaneously)
        for (let i = 0; i < indices_mergeable.length; ++i)
            if (indices_mergeable[i][1] === 1)
                for (let j = 0; j < indices_moveable.length; ++j)
                    if (indices_moveable[j][1] === 1 && indices_moveable[j][0] === indices_mergeable[i][0])
                    {
                        indices_moveable.splice(j, 1);
                        break;
                    }
        

        // get mask
        let mask = [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]];
        for (let i = 0; i < indices_moveable.length; ++i)
            mask[indices_moveable[i][0]][indices_moveable[i][1]] = 0;

        for (let i = 0; i < 4; ++i)
            for (let j = 0; j < 4; ++j)
                if (this.numbers[i][j] === 0)
                    mask[i][j] = 0;

        // get animation grids
        let animates_move = [];
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let number = this.numbers[indices_moveable[i][0]][indices_moveable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_move = new AnimateMove(indices_moveable[i], "r", this.move_velocity, number, font, color, text_y_offset);

            animates_move.push(animate_move);
        }

        let animates_merge = [];
        for (let i = 0; i < indices_mergeable.length; ++i)
        {
            let number = this.numbers[indices_mergeable[i][0]][indices_mergeable[i][1]];
            let digit = Math.ceil(Math.log10(number));
            let color = this.num2color.get(number);
            if (color === undefined)
                color = this.num2color.get(2048);
            let font = this.num2font.get(digit);
            let text_y_offset = this.num2y_offset.get(digit);
            let animate_merge = new AnimateMerge(indices_mergeable[i], "r", this.merge_velocity, number, font, color, text_y_offset);

            animates_merge.push(animate_merge);            
        }

        // nothing to update
        if (animates_move.length === 0 && animates_merge.length === 0)
            return;
        
        // animation loop
        let timer;
        console.log(animates_move);
        let loop = function()
        {
            Helper.draw_background();
            Helper.draw_with_mask(mask);

            for (let i = 0; i < animates_move.length; ++i)
            {
                animates_move[i].draw();
                animates_move[i].update();
            }

            for (let i = 0; i < animates_merge.length; ++i)
            {
                animates_merge[i].draw();
                animates_merge[i].update();
            }

            // in case of nothing to move while some grids need merged
            try 
            {
                if (animates_move[0].x_offset <= width / 2 - height / 2 + (indices_moveable[0][1] + 1) * (gap + grid_size) + gap)
                    timer = window.requestAnimationFrame(loop);
                else
                    window.cancelAnimationFrame(timer);
            } 
            catch (TypeError)
            {
                if (animates_merge[0].x_offset === animates_merge[0].x_offset_const && !animates_merge[0].flag)
                    window.cancelAnimationFrame(timer);
                else;
                    timer = window.requestAnimationFrame(loop);
            }
        };

        loop();

        // update number grids
        for (let i = 0; i < indices_moveable.length; ++i)
        {
            let row = indices_moveable[i][0];
            let col = indices_moveable[i][1];
            this.numbers[row][col + 1] = this.numbers[row][col];
            this.numbers[row][col] = 0;
        }
    }
}

class Helper
{
    static random_minmax(min, max)
    {
        return Math.random() * (max - min) + min;
    }

    static draw_background()
    {
        background.draw();
    }

    static draw_with_mask(mask)
    {
        NG.draw_with_mask(mask);
    }

    // stupid sleep x
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        // set baseline
        ctx.textBaseline = "middle";
        // align based on x values in fillText
        ctx.textAlign = "center";
        ctx.fillText(String(this.number), this.x_offset_const, this.y_offset_const + this.text_y_offset);
    }

    update()
    {
        this.y_offset -= this.velocity;
        if (this.y_offset < this.y_final)
        {
            this.y_offset = this.y_final;
            this.x_offset = this.x_offset_const - grid_size / 2;
            return;
        }
        this.x_offset -= this.velocity;
    }
}

class AnimateMove
{
    constructor(index, direction, velocity, number, font, color, text_y_offset)
    {
        this.index = index;
        this.direction = direction;
        this.velocity = velocity;
        this.number = number;
        this.font = font;
        this.color = color;
        this.text_y_offset = text_y_offset;
        // origin grid offset (top left, absolute)
        this.x_offset = this.x_offset_const = width / 2 - height / 2 + index[1] * (gap + grid_size) + gap;
        this.y_offset = this.y_offset_const = index[0] * (gap + grid_size) + gap;
    }

    draw()
    {
        // draw rectangle
        let rec = new FilletRectangle(this.x_offset, this.y_offset, grid_size, grid_size, 5, this.color);
        rec.draw();

        // draw text
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = this.font;

        // set baseline
        ctx.textBaseline = "middle";
        // align based on x values in fillText
        ctx.textAlign = "center";
        ctx.fillText(String(this.number), this.x_offset + grid_size / 2, this.y_offset + grid_size / 2 + this.text_y_offset);
    }

    update()
    {
        switch (this.direction) 
        {
            case "u":
                this.y_offset -= this.velocity;
                if (this.y_offset < this.y_offset_const - grid_size - gap)
                    this.y_offset = this.y_offset_const - grid_size - gap;
                break;

            case "d":
                this.y_offset += this.velocity;
                if (this.y_offset > this.y_offset_const + grid_size + gap)
                    this.y_offset = this.y_offset_const + grid_size + gap;
                break;

            case "l":
                this.x_offset -= this.velocity;
                if (this.x_offset < this.x_offset_const - grid_size - gap)
                    this.x_offset = this.x_offset_const - grid_size - gap;
                break;

            case "r":
                this.x_offset += this.velocity;
                if (this.x_offset > this.x_offset_const + grid_size + gap)
                    this.x_offset = this.x_offset_const + grid_size + gap;
                break;

            default:
                throw "Invalid direction!";
        }
    }
}

class AnimateMerge
{
    constructor(index, direction, velocity, number, font, color, text_y_offset)
    {
        this.index = index;
        this.direction = direction;
        this.velocity = velocity;
        this.number = number;
        this.font = font;
        this.color = color;
        this.text_y_offset = text_y_offset;
        // origin grid offset (top left, absolute)
        this.x_offset = this.x_offset_const = width / 2 - height / 2 + index[1] * (gap + grid_size) + gap;
        this.y_offset = this.y_offset_const = index[0] * (gap + grid_size) + gap;
        this.flag = true;
    }

    draw()
    {
        // draw rectangle
        let rec_size = grid_size + 2 * (this.x_offset_const - this.x_offset);
        let rec = new FilletRectangle(this.x_offset, this.y_offset, rec_size, rec_size, 5, this.color);
        rec.draw();

        // draw text
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.font = this.font;

        // set baseline
        ctx.textBaseline = "middle";
        // align based on x values in fillText
        ctx.textAlign = "center";
        ctx.fillText(String(this.number), this.x_offset_const + grid_size / 2, this.y_offset_const + grid_size / 2 + this.text_y_offset);
    }

    update()
    {
        if (this.flag)
        {
            this.x_offset -= this.velocity;
            this.y_offset -= this.velocity;
            if (this.y_offset_const - this.y_offset > gap)
            {
                this.x_offset = this.x_offset_const - gap;
                this.y_offset = this.y_offset_const - gap;
                this.flag = false;
            }
        }
        else
        {
            this.x_offset += this.velocity;
            this.y_offset += this.velocity;
            if (this.y_offset > this.y_offset_const)
            {
                this.x_offset = this.x_offset_const;
                this.y_offset = this.y_offset_const;
            }
        }
    }
}


let NG = new NumberGrids();
NG.generateRandomNumber();

document.addEventListener("keypress", function(e) 
{
    // detect 'g' or 'G'
    if (e.keyCode === 103 || e.keyCode === 71)
        NG.generateRandomNumber();
    // detect 'w' or 'W'
    if (e.keyCode === 119 || e.keyCode === 87)
    {
        NG.move_up();
        if (NG.isGameOver())
            game_over();
        else
            NG.generateRandomNumber();
    }
    // detect 's' or 'S'
    if (e.keyCode === 115 || e.keyCode === 83)
    {
        NG.move_down();
        if (NG.isGameOver())
            game_over();
        else
            NG.generateRandomNumber();
    }
    // detect 'a' or 'A'
    if (e.keyCode === 97 || e.keyCode === 65)
    {
        NG.move_left();
        if (NG.isGameOver())
            game_over();
        else
            NG.generateRandomNumber();
    }
    // detect 'd' or 'D'
    if (e.keyCode === 100 || e.keyCode === 68)
    {
        NG.move_right();
        if (NG.isGameOver())
            game_over();
        else
            NG.generateRandomNumber();
    }
});


function game_over()
{
    
}



