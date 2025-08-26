const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(`No document found with ID ${req.params.id}`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError(`No document found with ID ${req.params.id}`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    })
    // try { 
    // }
    // catch (err) {
    //   res.status(400).json({
    //     status: 'fail',
    //     message: err.message
    //   });
    // }
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError(`No document found with ID ${req.params.id}`, 404));
    }
    res.status(200).json(
      {
        status: 'success',
        data: {
          data: doc
        }
      }
    );
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId }
    }
    // FILTERING
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);
  
    // console.log(req.query, queryObj);
  
    // // ADVANCED FILTERING
    // // duration[gte]=5
    // // { difficulty: 'easy', duration: { gte: '5' } }
    // // { difficulty: 'easy', duration: { $gte: '5' } }
    // // gte, gt, lte, lt
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));
  
    // BUILD QUERY
    // const query = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
    // let query = Tour.find(JSON.parse(queryStr));
  
    // SORTING
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy);
    //   query = query.sort(sortBy)
    //   // sort('price ratingsAverage')
    // } else {
    //   query = query.sort('-createdAt');
    // }
  
    // FIELD LIMITING
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }
  
    // PAGINATION
    // ?page=2&limit=10 1-10 page1, 11-20 page2, 21-30 page3, ...
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);
    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) {
    //     throw new Error('This page does not exist!');
    //   }
    // }
  
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // const doc = await features.query.explain();
  
    // SEND RESPONSE
    res.status(200).json(
      {
        status: 'success',
        results: doc.length,
        data: {
          data: doc
        }
      }
    );
  });
