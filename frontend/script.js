function login(){

window.location.href="dashboard.html";

}







function addFood(){


let name=document.getElementById("foodName").value.trim();

let expiry=document.getElementById("expiryDate").value;

let quantity=Number(document.getElementById("quantity").value);

let unit=document.getElementById("unit").value;



if(name==="" || expiry==="" || isNaN(quantity)){


alert("Please complete all fields");


return;


}





let warning=checkQuantity(name,quantity,unit);



if(warning){


let confirmAdd=confirm(warning);


if(!confirmAdd){

return;

}


}






let food={


name:name,

expiry:expiry,

quantity:quantity,

unit:unit


};






let foods=JSON.parse(localStorage.getItem("foods")) || [];



foods.push(food);



localStorage.setItem(
"foods",
JSON.stringify(foods)
);





displayFood();

loadDashboard();

recipeSuggestion();






document.getElementById("foodName").value="";

document.getElementById("expiryDate").value="";

document.getElementById("quantity").value="";



}









function checkQuantity(name,quantity,unit){


name=name.toLowerCase();



if(unit==="kg" && quantity>20){

return `Are you sure you have ${quantity}kg of ${name}? This is a very large amount.`;

}



if(unit==="g" && quantity>5000){

return `Are you sure you have ${quantity}g of ${name}? This seems unusually high.`;

}



if(unit==="ml" && quantity>5000){

return `Are you sure you have ${quantity}mL of ${name}? This seems unusually high.`;

}



if(unit==="L" && quantity>10){

return `Are you sure you have ${quantity}L of ${name}? This seems unusually high.`;

}



if(unit==="pieces" && quantity>100){

return `Are you sure you have ${quantity} pieces of ${name}?`;

}



return null;


}









function daysLeft(date){


let today=new Date();

let expiry=new Date(date);



let difference=expiry-today;



return Math.ceil(
difference/(1000*60*60*24)
);


}









function displayFood(){



let foodList=document.getElementById("foodList");



if(!foodList){

return;

}





let foods=JSON.parse(localStorage.getItem("foods")) || [];



foodList.innerHTML="";





if(foods.length===0){


foodList.innerHTML="<p>No items added yet.</p>";

return;


}





foods.forEach(function(food,index){



let div=document.createElement("div");


div.className="food";



div.innerHTML=`

<div>

<h3>${food.name}</h3>

<p>
Quantity: ${food.quantity}${food.unit}
</p>

<p>
Expires in ${daysLeft(food.expiry)} days
</p>

</div>


<button onclick="removeFood(${index})">
Remove
</button>

`;



foodList.appendChild(div);



});


}









function removeFood(index){


let foods=JSON.parse(localStorage.getItem("foods")) || [];



foods.splice(index,1);



localStorage.setItem(
"foods",
JSON.stringify(foods)
);



displayFood();

loadDashboard();

recipeSuggestion();


}









function loadDashboard(){



let dashboardFood=document.getElementById("dashboardFood");

let expiringFood=document.getElementById("expiringFood");



if(!dashboardFood){

return;

}





let foods=JSON.parse(localStorage.getItem("foods")) || [];





dashboardFood.innerHTML="";

expiringFood.innerHTML="";






if(foods.length===0){


dashboardFood.innerHTML=
"<p>Your pantry is empty.</p>";


expiringFood.innerHTML=
"<p>No items expiring soon.</p>";


return;


}







foods.forEach(function(food){



let div=document.createElement("div");


div.className="food";



div.innerHTML=`

<div>

<h3>${food.name}</h3>

<p>
Quantity: ${food.quantity}${food.unit}
</p>

<p>
Expires in ${daysLeft(food.expiry)} days
</p>

</div>

`;



dashboardFood.appendChild(div);



});







let soon=foods.filter(function(food){


return daysLeft(food.expiry)<=3;


});






if(soon.length===0){


expiringFood.innerHTML=
"<p>No items expiring soon.</p>";


}

else{


soon.forEach(function(food){



let div=document.createElement("div");


div.className="food";



div.innerHTML=`

<div>

<h3>${food.name}</h3>

<p>
Expires in ${daysLeft(food.expiry)} days
</p>

</div>

`;



expiringFood.appendChild(div);



});


}



}









function recipeSuggestion(){



let recipeName=document.getElementById("recipeName");

let recipeText=document.getElementById("recipeText");



if(!recipeName){

return;

}




let foods=JSON.parse(localStorage.getItem("foods")) || [];



let ingredients=foods.map(function(food){

return food.name.toLowerCase();

});







if(
ingredients.includes("spinach") &&
ingredients.includes("lentils")
){


recipeName.innerHTML="Spinach Dhal";


recipeText.innerHTML=
"Uses ingredients already available in your kitchen.";


}





else if(
ingredients.includes("rice") &&
ingredients.includes("vegetables")
){


recipeName.innerHTML="Vegetable Rice";


recipeText.innerHTML=
"Uses rice and vegetables from your pantry.";


}





else if(foods.length>0){


recipeName.innerHTML="No recipe match yet";


recipeText.innerHTML=
"Add more ingredients to discover meal ideas.";


}





else{


recipeName.innerHTML="No suggestions yet";


recipeText.innerHTML=
"Add ingredients to get meal ideas.";


}



}







displayFood();

loadDashboard();

recipeSuggestion();