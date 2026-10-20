try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

class DesignBrandTests(unittest.TestCase):
    def test_design_name_and_product_name_stay_distinct(self):
        for name in ('DESIGN.md','design/README.md','docs/reference.md'):
            text=(ROOT/name).read_text()
            self.assertIn('Pi Workbench 1-bit',text,name)
            self.assertNotIn('Pi Workbench System 1',text,name)
        readme=(ROOT/'README.md').read_text()
        self.assertEqual(readme.splitlines()[0],'# Pi WorkStation')
        self.assertIn('Pi Workbench 1-bit',readme)
        self.assertIn('System 1 decides; System 2 produces',(ROOT/'CONSTITUTION.md').read_text())
