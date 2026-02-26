import Image from "next/image";
import Link from "next/link";

import { Group } from "@mantine/core";

import classes from "@/styles/home.module.css";

export default function HomePage() {
  return (
    <>
      <Image
        preload
        src={"/img/splashscreen.png"}
        alt="screen"
        width={1920}
        height={680}
        className={classes.splash_image}
      />
      <Group justify={"center"} align={"center"} mt={40} gap={10}>
        <Link href="/products" className={classes.button_82_pushable}>
          <span className={classes.button_82_shadow}></span>
          <span className={classes.button_82_edge}></span>
          <span className={classes.button_82_front}>สินค้าผลิตภัณฑ์</span>
        </Link>

        <Link href="/products" className={classes.button_82_pushable}>
          <span className={classes.button_82_shadow}></span>
          <span className={classes.button_82_edge}></span>
          <span className={classes.button_82_front}>สังฆทานออนไลน์</span>
        </Link>
      </Group>
    </>
  );
}
