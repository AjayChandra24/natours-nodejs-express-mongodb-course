const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'));
// exports.checkId = (req, res, next, val) => {
//   const tour = tours.find(el => el.id.toString() === req.params.id.toString());
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Tour not found'
//     });
//   }
//   next();
// };

// exports.checkRequestBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price in request body'
//     });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   res.status(200).json(
//     {
//       status: 'success',
//       requestedAt: req.requestTime,
//       results: tours.length,
//       data: {
//         tours
//       }
//     }
//   );
// };

// exports.getTour = (req, res) => {
//   const tour = tours.find(el => el.id.toString() === req.params.id.toString());
//   res.status(200).json(
//     {
//       status: 'success',
//       data: {
//         tour: tour
//       }
//     }
//   );
// };

// exports.createTour = (req, res) => {
//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);

//   tours.push(newTour);
//   fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
//     if (err) {
//       console.error('Error writing file:', err);
//       res.status(500).json({

//       })
//     } else {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour
//         }
//       })
//     }
//   });
// };

// exports.updateTour = (req, res) => {
//   const tour = tours.find(el => el.id.toString() === req.params.id.toString());
//   // <Update tour logic here>
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here>'
//     }
//   });
// };

// exports.deleteTour = (req, res) => {
//   const tour = tours.find(el => el.id.toString() === req.params.id.toString());
//   // tours.splice(tourIndex, 1);
//   // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
//   //   if (err) {
//   //     return res.status(500).json({
//   //       status: 'error',
//   //       message: 'Error deleting tour'
//   //     });
//   //   } else {
//   res.status(204).json({
//     status: 'success',
//     data: null
//   //     });
//   //   }
//   });
// };

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// upload.single('image');     req.file
// upload.array('image', 5);   req.files

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) { return next() }

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }));

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' }
    //   }
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/250/center/12.930132,77.615925/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1 // in radians unit

  if (!lat || !lng) {
    next(new AppError(`Please provide latitude and longitude in the format lat,lng.`), 400);
  }

  const tours = await Tour.find(
    {
      startLocation:
      {
        $geoWithin:
        {
          $centerSphere: [[lng, lat], radius]
        }
      }
    }
  );

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [ lat, lng ] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001

  if (!lat || !lng) {
    next(new AppError(`Please provide latitude and longitude in the format lat,lng.`), 400);
  }

  const distances = await Tour.aggregate([ // geoNear always needs to be the first stage in an aggregate
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier // comes in meters so changed to kms or miles
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // FILTERING
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach(el => delete queryObj[el]);

//   // console.log(req.query, queryObj);

//   // // ADVANCED FILTERING
//   // // duration[gte]=5
//   // // { difficulty: 'easy', duration: { gte: '5' } }
//   // // { difficulty: 'easy', duration: { $gte: '5' } }
//   // // gte, gt, lte, lt
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // console.log(JSON.parse(queryStr));

//   // BUILD QUERY
//   // const query = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
//   // let query = Tour.find(JSON.parse(queryStr));

//   // SORTING
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy)
//   //   // sort('price ratingsAverage')
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   // FIELD LIMITING
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }

//   // PAGINATION
//   // ?page=2&limit=10 1-10 page1, 11-20 page2, 21-30 page3, ...
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) {
//   //     throw new Error('This page does not exist!');
//   //   }
//   // }

//   // EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json(
//     {
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours
//       }
//     }
//   );
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // Tour.findOne({ _id: req.params.id });
//   if (!tour) {
//     return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//   }
//   res.status(200).json(
//     {
//       status: 'success',
//       data: {
//         tour
//       }
//     }
//   );
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   })
//   // try { 
//   // }
//   // catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err.message
//   //   });
//   // }
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!tour) {
//     return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });
