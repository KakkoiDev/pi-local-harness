import unittest
from laya.shell_guard import destructive_reason
from laya.engine import LayaEngine
from laya.models import ActionProposal,ActionOutcome

class ShellGuardTest(unittest.TestCase):
    def test_normal_commands_are_unrestricted(self):
        for command in ['env','ls /','whoami','cat /nonexistent','ls -la','git status','npm test','rm -rf ./build',
                        'echo "rm -fr *"','find . -name "*.py"']:
            self.assertIsNone(destructive_reason(command),command)
        engine=LayaEngine('', '/tmp/unused.log')
        self.assertEqual(engine.gatekeep(ActionProposal('execute_command',{'command':'env'},'diagnostic'),'standard'),ActionOutcome.ALLOW)
    def test_broad_recursive_deletion_is_blocked(self):
        for command in ['rm -fr *','rm -rf /','sudo rm -rf ~/*','rm --recursive --force .',
                        'rm -r "$HOME"','rm -rf /Users','echo okay; rm -rf /*',"bash -c 'rm -fr *'",'rm -rf ../','echo okay\nrm -fr *','sudo -u root /bin/rm -rf /',
                        "zsh -lc 'rm -fr *'",'rm -rf /Users/someone','rm -rf ./..']:
            self.assertIsNotNone(destructive_reason(command),command)
    def test_disk_destruction_is_blocked(self):
        for command in ['mkfs.ext4 /dev/sda','dd if=/dev/zero of=/dev/disk0','diskutil eraseDisk APFS Empty /dev/disk0']:
            self.assertIsNotNone(destructive_reason(command),command)
        self.assertIsNone(destructive_reason('dd if=input.bin of=output.bin'))

    def test_protected_permission_changes_and_readonly_disk_commands(self):
        for command in ['chmod -R 777 /','chown -R nobody /Users','find / -delete','wipefs --offset 0 /dev/sda','echo zero > /dev/disk0']:
            self.assertIsNotNone(destructive_reason(command),command)
        for command in ['chmod -R u+w ./build','wipefs /dev/sda','diskutil list','mkfs --help']:
            self.assertIsNone(destructive_reason(command),command)
