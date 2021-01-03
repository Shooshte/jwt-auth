exports.publicAccess = (req, res) => {
  res.status(200).send({ message: "Public Content." });
};

exports.userAccess = (req, res) => {
  res.status(200).send({ message: "User Content." });
};

exports.adminAccess = (req, res) => {
  res.status(200).send({ message: "Admin Content." });
};
