-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mer. 21 mai 2025 à 23:51
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `op`
--

-- --------------------------------------------------------

--
-- Structure de la table `article`
--

DROP TABLE IF EXISTS `article`;
CREATE TABLE IF NOT EXISTS `article` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `diametre` decimal(10,2) DEFAULT NULL,
  `foyer_id` int DEFAULT NULL,
  `indice_id` int DEFAULT NULL,
  `design_id` int DEFAULT NULL,
  `couleur_photo_id` int DEFAULT NULL,
  `traitement_id` int DEFAULT NULL,
  `axe` varchar(100) DEFAULT NULL,
  `addition` varchar(100) DEFAULT NULL,
  `prix_achat` decimal(10,2) DEFAULT NULL,
  `tva` decimal(5,2) DEFAULT NULL,
  `prix_vente` decimal(10,2) DEFAULT NULL,
  `code_a_barre` varchar(255) DEFAULT NULL,
  `expiration` date DEFAULT NULL,
  `fournisseur_id` varchar(100) DEFAULT NULL,
  `typeArticle_id` int DEFAULT NULL,
  `article_subfamily_id` int DEFAULT NULL,
  `type_stock` varchar(50) DEFAULT NULL,
  `origineArticle` enum('stock','fabrication') NOT NULL DEFAULT 'stock',
  PRIMARY KEY (`id`),
  KEY `foyer_id` (`foyer_id`),
  KEY `indice_id` (`indice_id`),
  KEY `design_id` (`design_id`),
  KEY `couleur_photo_id` (`couleur_photo_id`),
  KEY `traitement_id` (`traitement_id`),
  KEY `fournisseur_id` (`fournisseur_id`),
  KEY `typeArticle_id` (`typeArticle_id`),
  KEY `article_subfamily_id` (`article_subfamily_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `article`
--

INSERT INTO `article` (`id`, `code`, `libelle`, `diametre`, `foyer_id`, `indice_id`, `design_id`, `couleur_photo_id`, `traitement_id`, `axe`, `addition`, `prix_achat`, `tva`, `prix_vente`, `code_a_barre`, `expiration`, `fournisseur_id`, `typeArticle_id`, `article_subfamily_id`) VALUES
(1, '6424', 'aaaaaaaa', 3.00, 1, 1, 1, 1, 1, '11', '3', 3.00, 4.00, 12.00, '1111', '2025-05-16', '6425', 1, 1),
(2, 'SUGKH', 'VODAX UNIFOCAL ASPHÉRIQUE', 5.00, 1, 1, 1, 1, 1, '11', '7', 8.00, 4.00, 6.00, 'qsqsdqsdqsd', '2025-05-20', '6425', 1, 2);

-- --------------------------------------------------------

--
-- Structure de la table `article_families`
--

DROP TABLE IF EXISTS `article_families`;
CREATE TABLE IF NOT EXISTS `article_families` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `article_families`
--

INSERT INTO `article_families` (`id`, `code`, `name`, `group_id`) VALUES
(1, '001', 'test11', 1),
(2, '003', 'VODAX Unifocal', 3);

-- --------------------------------------------------------

--
-- Structure de la table `article_groups`
--

DROP TABLE IF EXISTS `article_groups`;
CREATE TABLE IF NOT EXISTS `article_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `article_groups`
--

INSERT INTO `article_groups` (`id`, `code`, `name`) VALUES
(1, '0001', 'test1'),
(2, '0002', 'test2'),
(3, '0003', 'VERRES OPTIQUES VODA');

-- --------------------------------------------------------

--
-- Structure de la table `article_subfamilies`
--

DROP TABLE IF EXISTS `article_subfamilies`;
CREATE TABLE IF NOT EXISTS `article_subfamilies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `family_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `family_id` (`family_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `article_subfamilies`
--

INSERT INTO `article_subfamilies` (`id`, `code`, `name`, `family_id`) VALUES
(1, '01', 'test111', 1),
(2, 'SUGKH', 'VODAX UNIFOCAL ASPHÉRIQUE', 2);

-- --------------------------------------------------------

--
-- Structure de la table `client`
--

DROP TABLE IF EXISTS `client`;
CREATE TABLE IF NOT EXISTS `client` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codee` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `raison_social` varchar(255) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `responsable` varchar(255) DEFAULT NULL,
  `tel` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `adresse` text,
  `rccm` varchar(100) DEFAULT NULL,
  `ninea` varchar(100) DEFAULT NULL,
  `code_douane` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `client`
--

INSERT INTO `client` (`id`, `codee`, `raison_social`, `email`, `password`, `responsable`, `tel`, `status`, `adresse`, `rccm`, `ninea`, `code_douane`) VALUES
(1, 'C003', 'test', 'test2@gmail.com', '$2b$10$LQ54qX30qEDRiXJYweQqPu2CMiI.9ZLWDbw2qcImyHdkQGYfDGk5y', 'test', 'test', 'inactive', 'test', 'rccm1', 'ninea1', 'code_douane1'),
(2, 'C004', 'sdfdsfdsf', 'malek.chaari96@gmail.com', '$2b$10$l.HplWdLsCwF2Ges8WlPIuVZO8QkQQdm7FmoZ7FtxcZ8kLJI922Ce', 'mhamed', '+216 55558048', 'active', 'kkkkkkkkkkkkkkkkk', 'rccm2', 'ninea2', 'code_douane2');

-- --------------------------------------------------------

--
-- Structure de la table `couleur_photo`
--

DROP TABLE IF EXISTS `couleur_photo`;
CREATE TABLE IF NOT EXISTS `couleur_photo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `couleur_photo`
--

INSERT INTO `couleur_photo` (`id`, `name`, `description`) VALUES
(1, 'ccc', 'ccc');

-- --------------------------------------------------------

--
-- Structure de la table `design`
--

DROP TABLE IF EXISTS `design`;
CREATE TABLE IF NOT EXISTS `design` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `design`
--

INSERT INTO `design` (`id`, `name`, `description`) VALUES
(1, 'bbb', 'bbb');

-- --------------------------------------------------------

--
-- Structure de la table `fournisseur`
--

DROP TABLE IF EXISTS `fournisseur`;
CREATE TABLE IF NOT EXISTS `fournisseur` (
  `code` varchar(100) NOT NULL,
  `raison_social` varchar(255) NOT NULL,
  `adresse` text,
  `mat_vin` varchar(100) DEFAULT NULL,
  `tel` varchar(20) DEFAULT NULL,
  `fax` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `responsable` varchar(255) DEFAULT NULL,
  `id_fiscale` varchar(100) DEFAULT NULL,
  `banque` varchar(255) DEFAULT NULL,
  `agence` varchar(255) DEFAULT NULL,
  `rib` varchar(100) DEFAULT NULL,
  `categorie_prix_vente` varchar(100) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `activite_economique` varchar(255) DEFAULT NULL,
  `remise` decimal(5,2) DEFAULT NULL,
  `taux_retenue` decimal(5,2) DEFAULT NULL,
  `rccm` varchar(100) DEFAULT NULL,
  `ninea` varchar(100) DEFAULT NULL,
  `code_douane` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `fournisseur`
--

INSERT INTO `fournisseur` (`code`, `raison_social`, `adresse`, `mat_vin`, `tel`, `fax`, `email`, `responsable`, `id_fiscale`, `banque`, `agence`, `rib`, `categorie_prix_vente`, `status`, `activite_economique`, `remise`, `taux_retenue`, `rccm`, `ninea`, `code_douane`) VALUES
('6425', 'qdqsd', 'Tunis, Gouvernorat Tunis, Tunisie', 'qsdqsd', '+216 55558048', '+216 55558048', 'malek.chaari@supcom.tn', 'melek chaari', 'qsdqsdqs', 'qdqsdqs', 'qdqsdqs', 'qdqsd', 'qsdqsd', 'qdqd', 'qsdqsd', 4.00, 0.00, 'rccm1', 'ninea1', 'code_douane1');

-- --------------------------------------------------------

--
-- Structure de la table `foyer`
--

DROP TABLE IF EXISTS `foyer`;
CREATE TABLE IF NOT EXISTS `foyer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `foyer`
--

INSERT INTO `foyer` (`id`, `name`, `description`) VALUES
(1, 'aasss', 'asss');

-- --------------------------------------------------------

--
-- Structure de la table `indice`
--

DROP TABLE IF EXISTS `indice`;
CREATE TABLE IF NOT EXISTS `indice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `indice`
--

INSERT INTO `indice` (`id`, `name`, `description`) VALUES
(1, 'aaaa', 'aaaa');

-- --------------------------------------------------------

--
-- Structure de la table `opticien`
--

DROP TABLE IF EXISTS `opticien`;
CREATE TABLE IF NOT EXISTS `opticien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codee` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `opticien`
--

INSERT INTO `opticien` (`id`, `codee`, `nom`, `prenom`, `email`, `password`, `role`) VALUES
(1, 'O001', 'laarousi', 'anis', 'anislaarousi@gmail.com', '$2b$10$5fPqAOVt9aZwPXbpHFISZumIduNhMxh2g1gR1Ng/991n4A7iTq7Gi', 'opticien');

-- --------------------------------------------------------

--
-- Structure de la table `stock`
--

DROP TABLE IF EXISTS `stock`;
CREATE TABLE IF NOT EXISTS `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `sphere` decimal(5,2) NOT NULL,
  `cylindre` decimal(5,2) NOT NULL,
  `quantite` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `article_id` (`article_id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `stock`
--

INSERT INTO `stock` (`id`, `article_id`, `sphere`, `cylindre`, `quantite`) VALUES
(1, 1, -3.00, -1.50, 100),
(2, 1, -3.00, -1.25, 109),
(3, 1, -3.75, -1.25, 40),
(4, 1, -2.25, -1.25, 20),
(5, 2, -3.50, -1.50, 20),
(6, 2, -3.00, -1.50, 18);

-- --------------------------------------------------------

--
-- Structure de la table `traitement`
--

DROP TABLE IF EXISTS `traitement`;
CREATE TABLE IF NOT EXISTS `traitement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `traitement`
--

INSERT INTO `traitement` (`id`, `name`, `description`) VALUES
(1, 'ddd', 'ddd');

-- --------------------------------------------------------

--
-- Structure de la table `typeArticle`
--

DROP TABLE IF EXISTS `typeArticle`;
CREATE TABLE IF NOT EXISTS `typeArticle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `typeArticle`
--

INSERT INTO `typeArticle` (`id`, `name`, `description`) VALUES
(1, 'eee', 'eee');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
