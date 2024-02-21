class HomeController {
    show = async (req, res) => {
        try {
            return res.render('index', {
                layout: "dashboard"
            });
        } catch (e) {
            console.log(e.message);
            return res.send({ message: "Error getting customers", code: 0 });
        }

    }

}

module.exports = new HomeController;