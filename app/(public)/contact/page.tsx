import Image from "next/image";
import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Card,
  ThemeIcon,
  Group,
  Box,
} from "@mantine/core";
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
  IconBrandFacebook,
  IconBrandLine,
} from "@tabler/icons-react";

export const metadata = {
  title: "ติดต่อเรา",
  description:
    "ติดต่อศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน โทรศัพท์ อีเมล Facebook Line Official สอบถามข้อมูลชุดสังฆทานและบริการจัดส่ง",
};

const contactInfo = [
  {
    icon: IconPhone,
    title: "โทรศัพท์",
    detail: "081-043-5031 , 098-974-5553",
    description: "โทรหาเราได้ในเวลาทำการ",
  },
  {
    icon: IconMapPin,
    title: "ที่อยู่",
    detail: "วัดทุ่งเศรษฐี",
    description: "202/16 หมู่ที่ 3 ต.นครชุม อ.เมือง จ.กำแพงเพชร 62000",
  },
  {
    icon: IconClock,
    title: "เวลาทำการ",
    detail: "เปิดทุกวัน 08:00 - 17:00",
    description: "รวมวันหยุดนักขัตฤกษ์",
  },
  {
    icon: IconBrandFacebook,
    title: "Facebook",
    detail: "ชฎาพร ทองธรรมชาติ",
    description: "ติดตามข่าวสารและกิจกรรมล่าสุด",
  },
];

export default function ContactPage() {
  return (
    <>
      <Box pos="relative" h={{ base: 200, sm: 300 }}>
        <Image
          src="/img/banner_contact.png"
          alt="ติดต่อเรา"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <Box
          pos="absolute"
          inset={0}
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack align="center" gap={4}>
            <Title order={1} c="white" ta="center">
              ติดต่อเรา
            </Title>
            <Text c="white" size="lg" ta="center" maw={500} opacity={0.9}>
              ยินดีให้บริการและตอบทุกคำถาม
            </Text>
          </Stack>
        </Box>
      </Box>

      <Container size="md" py="xl">
        <Stack gap="xl">
          <Stack gap="xs" align="center">
            <Title order={2}>ช่องทางติดต่อ</Title>
            <Text size="sm" c="dimmed" ta="center" maw={500}>
              สามารถติดต่อเราได้หลายช่องทาง
              ทีมงานพร้อมให้บริการและตอบทุกคำถามของท่าน
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {contactInfo.map((info) => (
              <Card key={info.title} withBorder radius="md" p="lg">
                <Group gap="md" align="flex-start">
                  <ThemeIcon
                    size={48}
                    radius="md"
                    variant="light"
                    color="green"
                  >
                    <info.icon size={24} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {info.title}
                    </Text>
                    <Text fw={600} mt={2}>
                      {info.detail}
                    </Text>
                    <Text size="sm" c="dimmed" mt={2}>
                      {info.description}
                    </Text>
                  </div>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          <Group align={"center"} justify={"center"}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1798.6231218385876!2d99.495681!3d16.453564!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30de1903e4340b6d%3A0x234a6c879ce43cf3!2sWat%20Thung%20Setthi!5e1!3m2!1sen!2sth!4v1715934412099!5m2!1sen!2sth"
              width="100%"
              height="545"
            ></iframe>
          </Group>
        </Stack>
      </Container>
    </>
  );
}
