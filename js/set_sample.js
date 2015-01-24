var gobalTestString = "TestSandbox Gobal Var";

var cal_sum = 'function cal_sum (line){var numbers = line.split(" ");return numbers[0] + numbers[1];}';
var cal_sub = 'function cal_sub (line){var numbers = line.split(" ");return numbers[0] - numbers[1];}';
var cal_multi = 'function cal_multi (line){var numbers = line.split(" ");return numbers[0] * numbers[1];}';


var testGobal = 'function testGobal (line){ console.log(gobalTestString) }';

termish.installScript("cal_sum",1,cal_sum);
termish.installScript("cal_sub",1,cal_sub);
termish.installScript("cal_multi",1,cal_multi);
termish.installScript("testGobal",1,testGobal);


termish.executeScript("cal_sum","1 4");
termish.executeScript("cal_sub","1 4");
termish.executeScript("cal_multi","1 4");

termish.executeScript("testGobal","1 4");

