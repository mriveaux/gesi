<?php

class Nivelprep extends Doctrine_Record {

    public function setUp() {
        parent::setUp();
    }

    public function setTableDefinition() {
        $this->setTableName('estructuraorg.nivelprep');
        $this->hasColumn('idnivelprep', 'numeric', null, array('notnull' => true, 'primary' => true, 'sequence' => 'estructuraorg.nivelprep_idnivelprep'));
        $this->hasColumn('nombre', 'character varying', 255, array('notnull' => false, 'primary' => false));
        $this->hasColumn('abreviatura', 'character varying', 50, array('notnull' => false, 'primary' => false));
    }

    public function getNivelprep($post) {
        try {
            $query = Doctrine_Query::create();
            $queryCount = Doctrine_Query::create();
            $query->from('Nivelprep t')
                    ->offset($post->start)
                    ->limit($post->limit)
                    ->setHydrationMode(Doctrine::HYDRATE_ARRAY);

            $queryCount->from('Nivelprep t')
                    ->setHydrationMode(Doctrine::HYDRATE_RECORD);

            if (isset($post->criterio) > 0) {
                $criterio = $post->criterio;
                $query->addWhere("t.nombre ilike '%" . $criterio . "%' OR t.abreviatura ilike '%" . $criterio . "%'");
                $queryCount->addWhere("t.nombre ilike '%" . $criterio . "%' OR t.abreviatura ilike '%" . $criterio . "%'");
            }

            $query->addOrderBy('t.nombre ASC');
            $result = $query->execute();
            $count = $queryCount->execute();
            return array('data' => $result, 'total' => $count->count());
        } catch (Exception $exc) {
            echo $exc->getTraceAsString();
        }
    }

    public function buscarNivelprep($nombre, $idnivelprep = 0) {
        $query = Doctrine_Query::create();
        $result = $query->select('*')
                ->from('Nivelprep t')
                ->where('t.nombre = ?', array($nombre))
                ->setHydrationMode(Doctrine::HYDRATE_ARRAY)
                ->execute();

        if (count($result) > 0) {
            if ($idnivelprep != 0)
                return ($result[0]['idnivelprep'] == $idnivelprep) ? 0 : 1; // 0-> se puede mod, 1-> no mod
            else
                return 1;
        }
        else
            return 0; // 1-> encontro, 0->no encontro        
    }

    //hasta que se implemente capital humano devuelve false
    public function isUsed($idNivelprep) {
        try {
//            $sql = "SELECT * from estructuraorg.escalasalarial es WHERE es.idnivelprep = $idNivelprep;";
//            $cc = Doctrine_Manager::getInstance()->getCurrentConnection();
//            $result = $cc->fetchAll($sql);
//            if (count($result) > 0) {
//                return 1;
//            }
            return -1;
        } catch (Doctrine_Exception $exc) {
            echo $exc->getTraceAsString();
        }
    }

    public function getAllNivelPrep() {
        try {
            $query = Doctrine_Query::create();
            return array('data' => $query->from('Nivelprep n')->setHydrationMode(Doctrine::HYDRATE_ARRAY)->addOrderBy('n.nombre ASC')->execute());
        } catch (Exception $exc) {
            echo $exc->getTraceAsString();
        }
    }

}
