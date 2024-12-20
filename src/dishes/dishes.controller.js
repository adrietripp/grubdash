const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// Validation middleware
function bodyHasName(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (!name || name === "") {
    return next({ status: 400, message: "Dish must include a name" });
  }
  next();
}

function bodyHasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (!description || description === "") {
    return next({ status: 400, message: "Dish must include a description" });
  }
  next();
}

function bodyHasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price === undefined || price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function bodyHasImageUrl(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (!image_url || image_url === "") {
    return next({ status: 400, message: "Dish must include a image_url" });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
}

function validateIdMatch(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

// Handlers
function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Update the dish
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [bodyHasName, bodyHasDescription, bodyHasPrice, bodyHasImageUrl, create],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasImageUrl,
    validateIdMatch,
    update,
  ],
};

