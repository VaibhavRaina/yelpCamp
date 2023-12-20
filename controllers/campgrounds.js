const Campground = require('../models/campground');
const { cloudinary } = require(`../cloudinary`)


module.exports.index = async function (req, res) {
    const campgrounds = await Campground.find({});
    res.render(`campgrounds/index`, { campgrounds })
}

module.exports.renderNewForm = async function (req, res) {
    res.render(`campgrounds/new`)
}

module.exports.createCampground = async function (req, res) {
    const campground = new Campground(req.body.campground);
    campground.images = req.files.map(function (f) {
        return ({ url: f.path, filename: f.filename })
    })
    campground.author = req.user._id;
    await campground.save();
    req.flash(`success`, `Success In Creating A Campground `);
    res.redirect(`/campgrounds/${campground._id}`);
}
module.exports.showCampground = async function (req, res) {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate({
        path: `reviews`,
        populate: {
            path: `author`,
        }
    }).populate(`author`);
    if (!campground) {
        req.flash(`error`, `No Campground Found `);
        return res.redirect(`/campgrounds`);
    }
    res.render(`campgrounds/show`, { campground })
}

module.exports.renderEditForm = async function (req, res) {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash(`error`, `No Campground Found `);
        return res.redirect(`/campgrounds`);
    }
    res.render(`campgrounds/edit`, { campground })
}

module.exports.updateCampground = async function (req, res) {
    const { id } = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleImages) {
        for (let filename of req.body.deleImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleImages } } } });
    }
    req.flash(`success`, `Successfully Updated a Campground `);
    res.redirect(`/campgrounds/${campground._id}`);
}
module.exports.deleteCampground = async function (req, res) {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash(`success`, `Successfully deleted a campground `);
    res.redirect(`/campgrounds`)
}