'use strict';

/**
 * Базові декларації
 */

var count = 0;
var table_values = {};
var karnaugh_table = [];

String.prototype.reverse = function reverse() {
    return this.split('').reverse().join('');
}

String.prototype.replaceAt = function replaceAt(position, value) {
    return this.substr(0, position) + value + this.substr(position + 2, this.length);
}

function bin_repr(number, length=0) {
    if (number !== +number) {
        return '';
    }
    var source_value = number;
    var str = '';
    while (source_value > 0) {
        var rem = source_value % 2;
        str += rem;
        source_value = ( source_value - rem ) / 2;
    }
    str = str.reverse();
    if (length > 0) {
        while (str.length < length) {
            str = '0' + str;
        }
    }
    if (!str) {
        str = '0';
    }
    return str;
}

/**
 * Вибір кількості змінних
 */

function count_select() {
    count = parseInt(
        document.querySelectorAll('#count')[0].value);
    table_display();
}

/**
 * Налаштування функції (вибір значень функції в залежності від значень змінних)
 */

function spawn_row(input_list) {
    if (input_list.length < count) {
        return (
            spawn_row(input_list + [0], input_list.length + 1) +
            spawn_row(input_list + [1], input_list.length + 1)
        );
    }
    var result = '<tr><td></td>';
    var hash = build_hash(input_list);
    for ( var i = 0; i < count; ++i) {
        result += `<td>${input_list[i]}</td>`;
    }
    result += `<td onclick="toggle_item('${hash}')"><center>${(table_values[hash])?1:0}</center></td>`
    result += '</tr>';
    return result;
}

function table_display() {
    var table = '<table><thead>';
    // Відображення заголовку в таблиці
    table += '<th>№</th>';
    for ( var i = 0; i < count ; ++i ) {
        table += `<th>x<sub>${i}</sub></th>`;
    }
    table += '<th>Значення</th>';
    table += '</thead><tbody>';
    // Відображення таблиці істинності
    table += spawn_row([0]);
    table += spawn_row([1]);
    table += '</tbody></table>';
    document.body.innerHTML = `<h1>Кількість елементів: ${count}</h1> ${table}  <button onclick="finalize_processing()">Виконати розрахунок</button>`;
}

function build_hash(item) {
    var hash = '';
    for (var val of item) {
        hash += val;
    }
    return hash;
}

function toggle_item(hash) {
    table_values[hash] = !table_values[hash];
    table_display();
}

/**
 * Побудова базової функції (з таблиці, введеної раніше)
 */

function build_function() {
    var func = '';
    var items = Object.keys(table_values);
    for (var i = 0; i < items.length; ++i) {
        var x = 0;
        var item = items[i];
        func += '( '
        for (var j = 0; j < item.length; ++j) {
            func += (item[j] === '1' ? '' : '!') + `x<sub>${x}</sub> && `;
            ++x;
        }
        func = func.slice(0, -3);
        func += ' )'
        func += ' || ';
    }
    func = func.slice(0, -3);
    return func;
}

function grays_next_num(num, length) {
    return bin_repr(num ^ (num >>> 1), length);
}

/**
 * Побудова відображення карти карно
 */ 
function build_karnaugh_table() {
    var left_count = (count - count % 2 ) / 2;
    var top_count = count - left_count;

    var karnaugh_vertical = [];
    var karnaugh_horisontal = [];
    for (var num = 0; num < Math.pow(2, top_count); ++num) {
        karnaugh_vertical.push(grays_next_num(num, top_count));
    }
    for (var num = 0; num < Math.pow(2, left_count); ++num) {
        karnaugh_horisontal.push(grays_next_num(num, left_count));
    }

    var res_map = '<table><tr><th></th>';
    for (var i = 0; i < karnaugh_vertical.length; i++) {
        res_map += `<th>${karnaugh_vertical[i]}</th>`;
    }
    res_map += '</tr>';
    for (var i = 0; i < karnaugh_horisontal.length; ++i) {
        res_map += '<tr>';
        var hor = karnaugh_horisontal[i];
        res_map += `<th>${karnaugh_horisontal[i]}</th>`;
        for (var j = 0; j < karnaugh_vertical.length; ++j) {
            var ver = karnaugh_vertical[j];
            res_map += `<td id="${hor}${ver}">${(table_values[ver+hor])?1:0}</td>`;
        }
        res_map += '</tr>';
    }

    res_map += '</table>';
    return res_map;
}


/**
 * Побудова відображення можливих спрощень карти
 */

function build_karnaugh_map() {
    function strDifferByOne(first, second) {
        if (first.length != second.length)  {
            return false;
        }
        var count = 0;
        for (var i = 0; i < first.length; ++i) {
            var f = first[i];
            var s = second[i];
            if (f !== s) {
                count++;
            }
            if (count > 1)
                return false;
        }
        return count === 1;
    }

    function Pair(first, second) {
        this.first = first;
        this.second = second;
        this.exists = (first, second) => {
            return (
                (this.first == first && this.second == second) ||
                (this.first == second && this.second == first)
            )
        };
    }

    function hasInList(f,s) {
        for (var x of res) {
            if (x.exists(f,s))
                return true;
        } 
        return false;
    }

    var res = [];
    var variants = Object.keys(table_values);
    for (var key of variants) {
        for (var key_ of variants) {
            if (key === key_ || hasInList(key, key_))
                continue;
            if (
                table_values[key] &&
                table_values[key_] &&
                strDifferByOne(key, key_)
            ) {
                res.push(new Pair(key, key_));
            }
        }
    }
    return res;
}

function render_karnaugh_map(data) {
    var result = '<h3>Можливі спрощення:</h3><table><thead><th></th><th></th></thead><tbody>';
    for (var pair of data) {
        result += `<tr><td>${pair.first}</td><td>${pair.second}</td></tr>`;
    }
    result += '</tbody></table>';
    return result;
}

/**
 * Спрощена функція
 */

function build_optimized_function(optimizations) {
    function findDifference(first, second) {
        if (first.length != second.length) {
            alert('Чото не то сталось');
            return null;
        }
        for (var i = 0; i < first.length; ++i) {
            var f = first[i];
            var s = second[i];
            if (f != s)
                return i;
        }
        return null;
    }

    debugger;
    var key_pool = [];
    var optimized = {};
    for (var pair of optimizations) {
        if (key_pool.indexOf(pair.first) >= 0 || key_pool.indexOf(pair.second) >= 0)
            continue;
        var diff_position = findDifference(pair.first, pair.second);
        key_pool.push(pair.first, pair.second);
        var key = pair.first;
        key = key.replaceAt(diff_position, '_');
        optimized[key] = 1;
    }
    for (var key of Object.keys(table_values)) {
        if (key_pool.indexOf(key) < 0){
            if (table_values[key])
                optimized[key] = 1;
            key_pool.push(key);
        } 
    }
    return optimized;
}

function render_optimized_func(dict) {
    debugger;
    var func = '';
    var items = Object.keys(dict);
    for (var i = 0; i < items.length; ++i) {
        var x = 0;
        var item = items[i];
        func += '( ';
        for (var j = 0; j < item.length; ++j) {
            switch (item[j]) {
                case '1':
                    func += `x<sub>${x}</sub> && `; 
                    break;
                case '0':
                    func += `!x<sub>${x}</sub> && `
                    break;
                case '_':
                    break;
            }
            ++x;
        }
        func = func.slice(0, -3);
        func += ' )'
        func += ' || ';
    }
    func = func.slice(0, -3);
    return func;
}

/**
 * Функція відображення останньої сторінки
 */

function finalize_processing() {
    var head_func = '<h3>Результуюча функція</h3>';
    var head_opt_func = '<h3>Спрощена функція</h3>';
    var head_table = '<h3>Карта Карно</h3>';
    var formula = `F = ${build_function()}`;
    var optimizations = build_karnaugh_map();
    var optimized_dict = build_optimized_function(optimizations);
    var opt_formula = `<i>F</i> = ${render_optimized_func(optimized_dict)}`;
    document.body.innerHTML = head_func + formula + head_table + build_karnaugh_table() + render_karnaugh_map(optimizations) + head_opt_func + opt_formula;
}

