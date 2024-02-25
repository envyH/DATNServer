class BannerController {
    show = async (req, res) => {
        try {
            return res.render('index', {
                layout: "banner",
                banners: []
            });
        } catch (e) {
            console.log("BannerController: ", e.message);
            return res.send({ message: "Error getting customers", code: 0 });
        }

    }

}

module.exports = new BannerController;