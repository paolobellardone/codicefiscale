/**
 * @license
 * MIT License
 * 
 * Copyright (c) 2024 PaoloB
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * @ignore
 */

// Initialize application
//
const express = require('express')
const cors = require('cors')
const parser = require('body-parser')

const app = express()

app.use(parser.json()) // support json encoded bodies
app.use(parser.urlencoded({ extended: true })) // support encoded bodies

app.use(cors())
app.options('*', cors())
app.use(function (req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  next();
});

const port = process.env.CF_PORT || 9000;

// Server
const server = app.listen(port, async function () {
  let host = server.address().address
  let port = server.address().port
});

let CodiceFiscale = {}

// WARINING: Does not manage "omocodie" - same generated codes for persons with same name, town, birth date, gender

CodiceFiscale.towns = require('./comuni.json') // Load town codes from file comuni.json - update as required

CodiceFiscale.months = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T']

CodiceFiscale.control_char_odd = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19,
  9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17,
  I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6,
  R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23
}

CodiceFiscale.control_char_even = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8,
  9: 9, A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7,
  I: 8, J: 9, K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16,
  R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25
}

CodiceFiscale.control_char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

CodiceFiscale.eval_control_char = function (tax_code)
// tax code is Italian "Codice Fiscale"
{
  let i, val = 0
  for (i = 0; i < 15; i++) {
    let c = tax_code[i]
    if (i % 2)
      val += this.control_char_even[c]
    else
      val += this.control_char_odd[c]
  }
  val = val % 26
  return this.control_char.charAt(val)
}

CodiceFiscale.get_consonants = function (str) {
  return str.replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/gi, '')
}

CodiceFiscale.get_vowels = function (str) {
  return str.replace(/[^AEIOU]/gi, '')
}

CodiceFiscale.capitalize_string = function (string) {
  return string.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

CodiceFiscale.eval_surname_code = function (surname) {
  let surname_code = this.get_consonants(surname)
  surname_code += this.get_vowels(surname)
  surname_code += 'XXX'
  surname_code = surname_code.substr(0, 3)
  return surname_code.toUpperCase()
}

CodiceFiscale.eval_name_code = function (name) {
  let name_code = this.get_consonants(name)
  if (name_code.length >= 4) {
    name_code =
      name_code.charAt(0) +
      name_code.charAt(2) +
      name_code.charAt(3)
  } else {
    name_code += this.get_vowels(name)
    name_code += 'XXX'
    name_code = name_code.substr(0, 3)
  }
  return name_code.toUpperCase()
}

CodiceFiscale.eval_date_code = function (dd, mm, yy, gender) {
  let d = new Date()
  d.setYear(yy)
  d.setMonth(mm - 1)
  d.setDate(dd)
  let year = "0" + d.getFullYear()
  year = year.substring(year.length - 2, 2)
  let month = this.months[d.getMonth()]
  let day = d.getDate()
  if (gender.toUpperCase() == 'F') day += 40
  day = "0" + day
  day = day.substr(day.length - 2, 2)
  return "" + year + month + day
}

CodiceFiscale.find_town = function (town) {
  let picked = this.towns.find(o => o.nome === town);
  return picked.codiceCatastale;
}

CodiceFiscale.eval_town_code = function (town) {
  return this.find_town(this.capitalize_string(town));
}

CodiceFiscale.eval_tax_code = function (name, surname, gender, day, month, year, town) {
  let tax_code =
    this.eval_surname_code(surname) +
    this.eval_name_code(name) +
    this.eval_date_code(day, month, year, gender) +
    this.eval_town_code(town)
  tax_code += this.eval_control_char(tax_code)
  return tax_code
}

// Invoke with the following command, see the payload samples below:
// curl -H "Content-Type: application/json" -X POST -d "{\"nome\": \"Paolo\", ...}" http://localhost:9000/cf

/*
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
*/

app.post('/cf', async function (request, response) {
  let codice = CodiceFiscale.eval_tax_code(
    request.body.name,
    request.body.surname,
    request.body.gender,
    request.body.day,
    request.body.month,
    request.body.year,
    request.body.town);
  response.status(200).send(JSON.parse('{ "message": "' + codice + '" }'));
})
